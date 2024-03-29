// το ευ προφέρεται εφ όταν ακολουθεί θ,κ,ξ,π,σ,τ,φ,χ
// Ενώ προφέρεται εβ όταν ακολουθεί α,ε,η,ο,ω,γ,δ,ζ,λ,μ,ν,ρ

export const code = "el";
export const READING_GRANULARITY = "syllable";

export const VOWELS_NOACCENTS = "αεηιουω";
export const DIGRAPH_VOWELS = ["αυ", "αι", "ει", "ευ", "ηυ", "οι", "ου", "υι"];
export const DIGRAPH_CONSONANTS = ["μπ", "ντ", "γκ", "τσ", "τζ", "γγ", "γξ", "γχ"];

export function is_vowel (letter, {previous} = {}) {
	let letterS = this.drop_accents(letter.toLowerCase());

	// υ can be either a vowel or a consonant
	if (letterS === "υ" && !["­ϋ", "ΰ"].includes(letter)) {
		if (previous === "α" || previous === "ε") {
			return false;
		}
	}

	return VOWELS_NOACCENTS.includes(letterS);
}