/**
 * A map of note names to their frequencies in the 4th octave
 */
const noteFrequencies = {
	'C': 261.63,  // C4
	'D': 293.66,  // D4
	'E': 329.63,  // E4
	'F': 349.23,  // F4
	'G': 392.00,  // G4
	'A': 440.00,  // A4
	'B': 493.88,  // B4
};

/**
 * Accepts a note like "C4" and returns the frequency of the note
 * @param {string} note
 * @returns {number}
 */
export function getNoteFrequency(note) {
	const [name, octave] = note;
	return noteFrequencies[name] * Math.pow(2, octave - 4);
}

/**
 * Play a music note using the Web Audio API and tries to make it sound like a piano
 * @param {string} note
 */
export function playNote(note, options = {}) {
	const { duration = 0.7 } = options;
	const frequency = getNoteFrequency(note);

	const audioContext = new AudioContext();

	// Create oscillators with mixed waveforms for richer harmonics
	const oscillators = [
		{ type: 'sine', frequency: frequency, gain: 1 },      // Fundamental
		{ type: 'triangle', frequency: frequency * 2, gain: 0.4 }, // Octave
		{ type: 'sine', frequency: frequency * 3, gain: 0.2 }, // Fifth above octave
	];

	// Create gain node for amplitude envelope
	const gainNode = audioContext.createGain();

	// Connect oscillators
	oscillators.forEach(osc => {
		const oscillator = audioContext.createOscillator();
		oscillator.type = osc.type;
		oscillator.frequency.value = osc.frequency;
		oscillator.connect(gainNode);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + duration);
	});

	gainNode.connect(audioContext.destination);

	// Piano-like envelope with quick attack and natural decay
	const now = audioContext.currentTime;
	gainNode.gain.setValueAtTime(0.5, now);
	gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
}

// Convert frequency to note name
export function frequencyToNote(frequency) {
	const A4 = 440;
	const C0 = A4 * Math.pow(2, -4.75);
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	// Calculate the number of half steps from C0
	const h = Math.round(12 * Math.log2(frequency / C0));

	// Force the octave to be within a reasonable range (0-8)
	let octave = Math.floor(h / 12);
	if (octave < 0) octave = 0;
	if (octave > 8) octave = 8;

	// Get the note name
	const note = noteNames[h % 12];

	// If the frequency is more than an octave away from the expected frequency,
	// adjust the octave accordingly
	const expectedFreq = noteFrequencies[note] * Math.pow(2, octave - 4);
	const ratio = frequency / expectedFreq;

	if (ratio > 1.5) {
		octave++;
	} else if (ratio < 0.75) {
		octave--;
	}

	return note + octave;
}
