import * as utils from './utils.js';
import { PitchDetector } from "https://esm.sh/pitchy@4";

// Make Pitchy available globally
globalThis.Pitchy = globalThis.Pitchy || {};

// Make utils available globally
globalThis.utils = utils;

let isRecording = false;
let audioContext;
let analyser;
let detector;
let input;
let lastNote = null;
let lastNoteTime = 0;
let lastPitch = 0;
let stableCount = 0;
let pitchHistory = [];
const HISTORY_SIZE = 20;
let lastAmplitude = 0;
let amplitudeDecayCount = 0;
const DECAY_THRESHOLD = 3; // Number of consecutive amplitude decreases to consider as release

// Update debug info
function updateDebugInfo(amplitude, pitch, clarity) {
	const debugInfo = document.getElementById('debug-info');
	// Convert amplitude to decibels (assuming 0 amplitude = -100 dB)
	const db = 20 * Math.log10(amplitude);
	debugInfo.innerHTML = `
		<dt>Amplitude</dt>
		<dd>${amplitude.toFixed(4)} (${db.toFixed(1)} dB)</dd>
		<dt>Pitch</dt>
		<dd>${pitch.toFixed(1)} Hz</dd>
		<dt>Clarity</dt>
		<dd>${(clarity * 100).toFixed(1)}%</dd>
	`;
}

// Get the most common note from recent history
function getModeNote() {
	if (pitchHistory.length === 0) return null;

	// Count occurrences of each note
	const noteCounts = {};
	pitchHistory.forEach(note => {
		noteCounts[note] = (noteCounts[note] || 0) + 1;
	});

	// Find the note with highest count
	let maxCount = 0;
	let modeNote = null;
	for (const [note, count] of Object.entries(noteCounts)) {
		if (count > maxCount) {
			maxCount = count;
			modeNote = note;
		}
	}

	return modeNote;
}

// Analyze harmonics to find the fundamental frequency
function findFundamentalFrequency(analyser, currentPitch) {
	const frequencyData = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(frequencyData);

	// Convert to linear scale and normalize
	const linearData = frequencyData.map(db => Math.pow(10, db / 20));
	const maxAmplitude = Math.max(...linearData);
	const normalizedData = linearData.map(a => a / maxAmplitude);

	// Find peaks in the frequency spectrum
	const peaks = [];
	for (let i = 1; i < normalizedData.length - 1; i++) {
		if (normalizedData[i] > normalizedData[i - 1] && normalizedData[i] > normalizedData[i + 1]) {
			peaks.push({
				frequency: i * audioContext.sampleRate / analyser.fftSize,
				amplitude: normalizedData[i]
			});
		}
	}

	// Sort peaks by amplitude
	peaks.sort((a, b) => b.amplitude - a.amplitude);

	// Log the top 5 peaks
	const log = document.getElementById('log');
	log.value += 'Top 5 frequency peaks:\n';
	peaks.slice(0, 5).forEach(p => {
		log.value += `${p.frequency.toFixed(1)} Hz (${p.amplitude.toFixed(4)})\n`;
	});
	log.value += '\n';

	// If the current pitch is suspiciously low for a high note
	if (currentPitch < 500) {
		// Look for a peak that's an octave or two above the current pitch
		for (const peak of peaks) {
			const ratio = peak.frequency / currentPitch;
			// If the ratio is close to 2 (octave) or 4 (two octaves)
			if (Math.abs(ratio - 2) < 0.1 || Math.abs(ratio - 4) < 0.1) {
				return peak.frequency;
			}
		}
	}

	// If no better frequency found, return the current pitch
	return currentPitch;
}

// Detect pitch
function updatePitch() {
	if (!isRecording) return;

	analyser.getFloatTimeDomainData(input);
	const maxAmplitude = Math.max(...input);
	const db = 20 * Math.log10(maxAmplitude);
	const thresholdDb = parseFloat(document.getElementById('volume-threshold').value);

	// Detect amplitude decay (end of keypress)
	const isDecaying = db < lastAmplitude;
	if (isDecaying) {
		amplitudeDecayCount++;
	} else {
		amplitudeDecayCount = 0;
	}
	lastAmplitude = db;

	// Only proceed if there's significant sound
	if (db < thresholdDb) {
		// Clear history when there's silence
		pitchHistory = [];
		requestAnimationFrame(updatePitch);
		return;
	}

	const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);

	// If the detected pitch seems suspiciously low for a high note, try harmonic analysis
	let finalPitch = pitch;
	if (pitch < 500 && clarity > 0.6) {
		finalPitch = findFundamentalFrequency(analyser, pitch);
	}

	// Log the detection results
	const log = document.getElementById('log');
	log.value += `Pitch detection:\n`;
	log.value += `  Pitch: ${pitch.toFixed(1)} Hz\n`;
	if (finalPitch !== pitch) {
		log.value += `  Corrected pitch: ${finalPitch.toFixed(1)} Hz\n`;
	}
	log.value += `  Clarity: ${clarity.toFixed(3)}\n`;
	log.value += `  Sample rate: ${audioContext.sampleRate}\n`;
	log.value += `  FFT size: ${analyser.fftSize}\n`;
	log.value += `  Frequency resolution: ${(audioContext.sampleRate / analyser.fftSize).toFixed(4)} Hz\n\n`;

	// Scroll to bottom
	log.scrollTop = log.scrollHeight;

	updateDebugInfo(maxAmplitude, finalPitch, clarity);

	if (finalPitch > 0 && clarity > 0.6) {
		// Check if pitch is stable (within 0.5% of last pitch)
		const pitchDiff = Math.abs(finalPitch - lastPitch) / lastPitch;
		if (pitchDiff < 0.005) {
			stableCount++;
		} else {
			stableCount = 0;
		}
		lastPitch = finalPitch;

		// Only update if pitch has been stable for 10 frames
		if (stableCount >= 10) {
			const note = utils.frequencyToNote(finalPitch);
			const now = Date.now();

			// Add to history, with higher weight during release phase
			if (amplitudeDecayCount >= DECAY_THRESHOLD) {
				// During release phase, add the note multiple times to increase its weight
				for (let i = 0; i < 3; i++) {
					pitchHistory.push(note);
					if (pitchHistory.length > HISTORY_SIZE) {
						pitchHistory.shift();
					}
				}
			} else {
				// During attack/sustain, add normally
				pitchHistory.push(note);
				if (pitchHistory.length > HISTORY_SIZE) {
					pitchHistory.shift();
				}
			}

			// Get the most common note from recent history
			const modeNote = getModeNote();

			// Only update if it's a different note or enough time has passed
			if (modeNote !== lastNote || now - lastNoteTime > 1000) {
				lastNote = modeNote;
				lastNoteTime = now;
				document.getElementById('detected-notes').textContent = `${modeNote} (${Math.round(clarity * 100)}% clarity)`;
			}
		}
	}

	requestAnimationFrame(updatePitch);
}

// Update threshold value display
document.getElementById('volume-threshold').addEventListener('input', (e) => {
	const db = parseFloat(e.target.value);
	document.getElementById('threshold-value').textContent = `${db} dB`;
});

// Start/stop recording
document.getElementById('record').addEventListener('click', async () => {
	if (!isRecording) {
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			if (!audioContext) {
				audioContext = new AudioContext();
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 32768; // Increased for better resolution
				analyser.smoothingTimeConstant = 0.9;
				detector = PitchDetector.forFloat32Array(analyser.fftSize);
				detector.minVolumeDecibels = -50;
				detector.minFrequency = 20;
				detector.maxFrequency = 4500;
				input = new Float32Array(detector.inputLength);

				// Connect microphone to analyser
				const source = audioContext.createMediaStreamSource(stream);
				source.connect(analyser);
			}

			// Start recording
			isRecording = true;
			document.getElementById('record').textContent = '🎤 Stop';
			document.getElementById('detected-notes').textContent = 'Listening...';

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

