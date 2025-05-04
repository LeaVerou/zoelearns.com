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
	debugInfo.innerHTML = `
		<dt>Amplitude</dt>
		<dd>${amplitude.toFixed(4)}</dd>
		<dt>Pitch</dt>
		<dd>${pitch.toFixed(1)} Hz</dd>
		<dt>Clarity</dt>
		<dd>${(clarity * 100).toFixed(1)}%</dd>
	`;
}

// Update detected notes display
function updateNotesDisplay() {
	const notesDisplay = document.getElementById('detected-notes');
	notesDisplay.innerHTML = detectedNotes.map(note =>
		`<div class="note">${note}</div>`
	).join('');
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

// Detect pitch
function updatePitch() {
	if (!isRecording) return;

	analyser.getFloatTimeDomainData(input);
	const maxAmplitude = Math.max(...input);
	const threshold = parseFloat(document.getElementById('volume-threshold').value);

	// Detect amplitude decay (end of keypress)
	const isDecaying = maxAmplitude < lastAmplitude;
	if (isDecaying) {
		amplitudeDecayCount++;
	} else {
		amplitudeDecayCount = 0;
	}
	lastAmplitude = maxAmplitude;

	// Only proceed if there's significant sound
	if (maxAmplitude < threshold) {
		// Clear history when there's silence
		pitchHistory = [];
		requestAnimationFrame(updatePitch);
		return;
	}

	const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);
	updateDebugInfo(maxAmplitude, pitch, clarity);

	if (pitch > 0 && clarity > 0.6) {
		// Check if pitch is stable (within 0.5% of last pitch)
		const pitchDiff = Math.abs(pitch - lastPitch) / lastPitch;
		if (pitchDiff < 0.005) {
			stableCount++;
		} else {
			stableCount = 0;
		}
		lastPitch = pitch;

		// Only update if pitch has been stable for 10 frames
		if (stableCount >= 10) {
			const note = utils.frequencyToNote(pitch);
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
	document.getElementById('threshold-value').textContent = e.target.value;
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
				analyser.fftSize = 16384; // Increased for even better resolution
				analyser.smoothingTimeConstant = 0.9; // Increased smoothing
				detector = PitchDetector.forFloat32Array(analyser.fftSize);
				detector.minVolumeDecibels = -50;
				detector.minFrequency = 20;
				detector.maxFrequency = 800; // Lowered further to focus on fundamental
				input = new Float32Array(detector.inputLength);
			}

			// Connect microphone to analyser
			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

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

