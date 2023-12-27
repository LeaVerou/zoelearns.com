export default class Language extends EventTarget {
	#Lang

	constructor (Lang) {
		super();
		this.#Lang = Lang;
	}

	get code () {
		return this.#Lang.code;
	}

	is_vowel (letter, {previous} = {}) {
		if (this.#Lang.is_vowel) {
			return this.#Lang.is_vowel.call(this, letter, {previous});
		}
		else if (this.#Lang.VOWELS) {
			// Simple lookup
			return this.#Lang.VOWELS.includes(letter);
		}
		else if (this.#Lang.VOWELS_NOACCENTS) {
			// Simple lookup, drop accents first
			letter = this.drop_accents(letter);
			return this.#Lang.VOWELS_NOACCENTS.includes(letter);
		}
	}

	segment (word) {
		if (!word) {
			return [word];
		}

		// Precomputed segments
		// This is an escape hatch to let us get away with not encoding the full range of complex rules
		if (word.segments) {
			return word.segments;
		}

		word = word.word ?? word;

		if (this.#Lang.segment) {
			return this.#Lang.segment.call(this, word);
		}

		// if (this.#Lang.READING_GRANULARITY === "grapheme") {
		// 	segmenter ??= new Intl.Segmenter(this.#Lang.code, {granularity: "grapheme"});
		// 	return [...segmenter.segment(word)].map(s => s.segment);
		// }
		if (this.#Lang.READING_GRANULARITY === "sound") {
			return this.segment_sounds(word);
		}
		else if (this.#Lang.READING_GRANULARITY === "syllable") {
			return this.segment_syllables(word);
		}
		else { // whole word
			return [word];
		}
	}

	is_vowel (letter, {previous} = {}) {
		if (this.#Lang.is_vowel) {
			return this.#Lang.is_vowel.call(this, letter, {previous});
		}
		else if (this.#Lang.VOWELS) {
			// Simple lookup
			return this.#Lang.VOWELS.includes(letter);
		}
		else if (this.#Lang.VOWELS_NOACCENTS) {
			// Simple lookup, drop accents first
			letter = this.drop_accents(letter);
			return this.#Lang.VOWELS_NOACCENTS.includes(letter);
		}
	}

	segment_syllables (word) {
		if (this.#Lang.syllabify) {
			return this.#Lang.syllabify.call(this, word);
		}

		// let DIGRAPH_VOWELS = Lang.DIGRAPH_VOWELS ?? [];
		// let DIGRAPH_CONSONANTS = Lang.DIGRAPH_CONSONANTS ?? [];

		// Fallback into default syllabizer
		let syllables = [];
		let syllable = "";

		let letter, previous;

		for (let i = 0; i < word.length; i++) {
			previous = letter;
			letter = word[i];
			syllable += letter;

			if (this.is_vowel(letter, {previous})) {
				// FIXME will be wrong for digraphs
				// FIXME will be wrong for consonant clusters
				syllables.push(syllable);
				syllable = "";
			}
		}

		if (syllable.length > 0) {
			syllables.push(syllable);
		}

		return syllables;
	}

	get DIGRAPHS () {
		return [...(this.#Lang.DIGRAPH_VOWELS || []), ...(this.#Lang.DIGRAPH_CONSONANTS || [])];
	}

	get segment_name () {
		return this.#Lang.READING_GRANULARITY;
	}

	segment_sounds(word) {
		let digraphs = this.DIGRAPHS;

		let digraphs_re = new RegExp(digraphs.join("|") + "|.", "g");
		return word.match(digraphs_re);
	}

	drop_accents (str) {
		// TODO define accent vs letter is in a language-sensitive way
		// E.g. in Serbian, Č is a distinct letter from C, yet the following code converts it to C
		return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}

	speak (word) {
		let utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = this.code;
		utterance.rate = .8;
		speechSynthesis.speak(utterance);
	}
}