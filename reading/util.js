export function dropAccents (str) {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isVowel (Lang, letter, {previous} = {}) {
	if (Lang.is_vowel) {
		return Lang.is_vowel(letter, {previous});
	}
	else if (Lang.VOWELS) {
		// Simple lookup
		return Lang.VOWELS.includes(letter);
	}
	else if (Lang.VOWELS_NOACCENTS) {
		// Simple lookup, drop accents first
		letter = dropAccents(letter);
		return Lang.VOWELS_NOACCENTS.includes(letter);
	}
}

export function syllabify (Lang, word) {
	if (Lang.syllabify) {
		return Lang.syllabify(word);
	}

	// Fallback into default syllabizer
	let syllables = [];
	let syllable = "";

	let letter, previous;

	for (let i = 0; i < word.length; i++) {
		previous = letter;
		letter = word[i];
		syllable += letter;

		if (isVowel(Lang, letter, {previous})) {
			// FIXME will be wrong for diphthongs
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