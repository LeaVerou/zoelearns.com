import * as utils from './utils.js';
import { AMDF, YIN, DynamicWavelet, ACF2PLUS, Macleod } from "https://esm.sh/pitchfinder@2.3.2/es2022/pitchfinder.mjs";

// Make Pitchy available globally
globalThis.Pitchy = globalThis.Pitchy || {};

// Make utils available globally
globalThis.utils = utils;

let isRecording = false;
let audioContext;
let analyser;
let detectors = [];
let input;
let lastAmplitude = 0;
let currentPitches = {
	Macleod: null,
	ACF2PLUS: null,
	YIN: null,
	ZeroCrossing: null
};
let wasQuiet = true; // Track if we were previously in silence
let lastLogTime = 0;
const LOG_INTERVAL = 1000; // Log every second
let quietFrames = 0;
const QUIET_THRESHOLD = 5; // Number of quiet frames before resetting
let lastBestPitch = null;
let stableFrames = 0;
const STABLE_THRESHOLD = 3; // Number of frames with same pitch before updating
let updateTimeout = null;

// Update debug info
function updateDebugInfo(amplitude, pitch, clarity) {
	const debugInfo = document.getElementById('debug-info');
	const db = 20 * Math.log10(amplitude);
	debugInfo.innerHTML = `
		<dt>Amplitude</dt>
		<dd>${amplitude.toFixed(4)} (${db.toFixed(1)} dB)</dd>
		<dt>Pitch</dt>
		<dd>${pitch === null ? 'No detection' :
			(typeof pitch === 'object' ? pitch.freq : pitch).toFixed(1)} Hz</dd>
		<dt>Clarity</dt>
		<dd>${(clarity * 100).toFixed(1)}%</dd>
	`;
}

// Helper function to update the UI for an algorithm
function updateAlgorithmResult(name, pitch) {
	const container = Array.from(document.querySelectorAll('.algorithm-result'))
		.find(el => el.querySelector('.algorithm-name').textContent === name);

	if (!container) {
		console.warn(`No container found for algorithm: ${name}`);
		return;
	}

	const noteElement = container.querySelector('.note');
	if (!noteElement) {
		console.warn(`No note element found in container for: ${name}`);
		return;
	}

	if (pitch) {
		const note = utils.frequencyToNote(pitch);
		noteElement.textContent = note;
	} else {
		noteElement.textContent = '-';
	}
}

// Helper function to get the best guess from all algorithms
function getBestGuess(macleodPitch, acfPitch, waveletPitch, zcPitch) {
	// Get all valid pitches
	const validPitches = [macleodPitch, acfPitch, waveletPitch, zcPitch].filter(p => p);
	if (validPitches.length === 0) return null;

	// If we have multiple valid pitches, check if they're octaves of each other
	if (validPitches.length > 1) {
		// Sort pitches from lowest to highest
		validPitches.sort((a, b) => a - b);

		// Check if higher pitches are octaves of the lowest
		const basePitch = validPitches[0];
		const isOctave = validPitches.every(p => {
			const ratio = p / basePitch;
			return Math.abs(Math.log2(ratio) - Math.round(Math.log2(ratio))) < 0.1;
		});

		if (isOctave) {
			return basePitch;
		}
	}

	// If pitches aren't octaves or we only have one, prefer Macleod, then ACF2+, then DynamicWavelet, then ZeroCrossing
	return macleodPitch || acfPitch || waveletPitch || zcPitch;
}

// Detect pitch
function updatePitch() {
	if (!isRecording) return;

	analyser.getFloatTimeDomainData(input);
	const maxAmplitude = Math.max(...input);
	const db = 20 * Math.log10(maxAmplitude);
	const thresholdDb = parseFloat(document.getElementById('volume-threshold').value);

	// Only process if we have significant sound
	if (db >= thresholdDb) {
		// Get results from all detectors
		const results = detectors.map(({name, detector}) => {
			const rawPitch = detector(input);
			return { name, rawPitch };
		});

		// Process results
		results.forEach(({name, rawPitch}) => {
			let pitch = rawPitch === null ? null :
				(typeof rawPitch === 'object' ? rawPitch.freq : rawPitch);

			if (typeof pitch === 'number' && (pitch < 20 || pitch > 4500)) {
				pitch = null;
			}

			currentPitches[name] = pitch;
		});

		// Debounce UI updates
		if (updateTimeout) {
			clearTimeout(updateTimeout);
		}
		updateTimeout = setTimeout(() => {
			const bestPitch = getBestGuess(currentPitches.Macleod, currentPitches.ACF2PLUS, currentPitches.YIN, currentPitches.ZeroCrossing);

			// Update UI
			updateAlgorithmResult('Macleod', currentPitches.Macleod);
			updateAlgorithmResult('ACF2+', currentPitches.ACF2PLUS);
			updateAlgorithmResult('YIN', currentPitches.YIN);
			updateAlgorithmResult('ZeroCrossing', currentPitches.ZeroCrossing);

			const mainNoteDisplay = document.querySelector('.note-display .note');
			if (mainNoteDisplay) {
				mainNoteDisplay.textContent = bestPitch ? utils.frequencyToNote(bestPitch) : '-';
			}

			const macleodResult = results.find(r => r.name === 'Macleod');
			const clarity = macleodResult?.rawPitch === null ? 0 :
				(typeof macleodResult?.rawPitch === 'object' ?
					Math.max(0, Math.min(1, macleodResult.rawPitch.probability)) : 1);
			updateDebugInfo(maxAmplitude, macleodResult?.rawPitch, clarity);
		}, 50); // 50ms debounce
	}

	requestAnimationFrame(updatePitch);
}

// Update threshold value display
document.getElementById('volume-threshold').addEventListener('input', (e) => {
	const db = parseFloat(e.target.value);
	document.getElementById('threshold-value').textContent = `${db} dB`;
});

// Clear log button
document.getElementById('clear-log').addEventListener('click', () => {
	document.getElementById('log').value = '';
});

// Start recording automatically when the page loads
document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('record').click();
});

// Helper function to detect pitch by zero crossings
function detectPitchByZeroCrossings(input, sampleRate) {
	// Find zero crossings
	let zeroCrossings = [];
	for (let i = 1; i < input.length; i++) {
		if ((input[i-1] < 0 && input[i] >= 0) || (input[i-1] > 0 && input[i] <= 0)) {
			zeroCrossings.push(i);
		}
	}

	if (zeroCrossings.length < 2) return null;

	// Calculate average period between zero crossings
	let totalPeriod = 0;
	for (let i = 1; i < zeroCrossings.length; i++) {
		totalPeriod += zeroCrossings[i] - zeroCrossings[i-1];
	}
	const averagePeriod = totalPeriod / (zeroCrossings.length - 1);

	// Convert period to frequency
	const frequency = sampleRate / averagePeriod;

	// Filter out frequencies outside our range
	if (frequency < 20 || frequency > 4500) return null;

	return frequency;
}

// Start/stop recording
document.getElementById('record').addEventListener('click', async () => {
	if (!isRecording) {
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			if (!audioContext) {
				audioContext = new AudioContext();
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 4096; // Reduced for faster processing
				analyser.smoothingTimeConstant = 0.8;
				detectors = [
					{
						name: "Macleod",
						detector: Macleod({
							minFrequency: 20,
							maxFrequency: 4500,
							sensitivity: 0.01,
							probabilityThreshold: 0.1
						})
					},
					{
						name: "ACF2+",
						detector: ACF2PLUS({
							minFrequency: 20,
							maxFrequency: 4500,
							sensitivity: 0.01
						})
					},
					{
						name: "YIN",
						detector: YIN({
							minFrequency: 20,
							maxFrequency: 4500,
							threshold: 0.01
						})
					},
					{
						name: "ZeroCrossing",
						detector: (input) => detectPitchByZeroCrossings(input, audioContext.sampleRate)
					}
				];
				input = new Float32Array(analyser.fftSize);

				// Connect microphone to analyser
				const source = audioContext.createMediaStreamSource(stream);
				source.connect(analyser);
			}

			// Start recording
			isRecording = true;
			document.getElementById('record').textContent = '🎤 Stop';
			// Initialize all algorithm results to '-'
			Array.from(document.querySelectorAll('.algorithm-result .note')).forEach(el => {
				el.textContent = '-';
			});

			// Start pitch detection
			updatePitch();
		} catch (err) {
			console.error('Error accessing microphone:', err);
		}
	} else {
		// Stop recording
		isRecording = false;
		document.getElementById('record').textContent = '🎤 Record';
	}
});

// Play note when form is submitted
document.querySelector('form').addEventListener('submit', (e) => {
	e.preventDefault();
	const note = document.getElementById('note').value;
	utils.playNote(note);
});

