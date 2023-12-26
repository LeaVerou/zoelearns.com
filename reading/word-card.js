import getPhotos from "../util/get-photos.js";

const vowels = "αεηιουω";
const consonants = "βγδζθκλμνξπρσςτφχψ";

// Λοιπόν το ευ προφέρεται εφ όταν ακολουθεί θ,κ,ξ,π,σ,τ,φ,χ
// Ενώ προφέρεται εβ όταν ακολουθεί α,ε,η,ο,ω,γ,δ,ζ,λ,μ,ν,ρ

export default {
	props: {
		word: Object,
		active: Boolean
	},

	data() {
		return {
			current_syllable: -1,
		}
	},

	computed: {
		syllables () {
			return this.word.syllables ?? this.syllabize(this.word.word);
		},
	},

	methods: {
		is_vowel (letter, {previous} = {}) {
			let letterS = dropAccents(letter.toLowerCase());

			if (letterS === "υ" && letter !== "­ϋ") {
				// υ can be either a vowel or a consonant
				if (previous === "α" || previous === "ε") {
					return false;
				}
			}

			return vowels.includes(letterS);
		},

		syllabize (word = this.word.word) {
			let syllables = [];
			let syllable = "";

			// Drop accents
			let normalizedWord = dropAccents(word);

			for (let i = 0; i < normalizedWord.length; i++) {
				let letter = normalizedWord[i];
				let originalLetter = word[i];
				syllable += originalLetter;

				if (this.is_vowel(letter)) {
					syllables.push(syllable);
					syllable = "";
				}
			}

			if (syllable.length > 0) {
				syllables.push(syllable);
			}

			return syllables;
		},

		goto_syllable (offset) {
			let newIndex = this.current_syllable + offset;

			if (newIndex === this.syllables.length) {
				newIndex = -1;
			}
			else if (newIndex < 0) {
				newIndex = this.syllables.length + 1 + newIndex;
			}

			this.current_syllable = newIndex;
		},

		previous_syllable () {
			return this.goto_syllable(-1);
		},

		next_syllable () {
			return this.goto_syllable(1);
		},

		async correct () {
			// Remove active syllable, if present
			this.current_syllable = -1;
			this.word.status = "correct";
			this.word.photos = (await getPhotos(this.word.en, {per_page: 4})).results;
		},

		next_word () {
			this.word.status ||= "skipped";
			this.$emit("next_word");
		},

		speak (word) {
			let utterance = new SpeechSynthesisUtterance(word);
			utterance.lang = "el-GR";
			utterance.rate = .8;
			speechSynthesis.speak(utterance);
		},

		handleEvent (evt) {
			if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
				this.previous_syllable();
			}
			else if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
				if (evt.shiftKey) {
					this.next_word();
				}
				else {
					this.next_syllable();
				}
			}
			else if (evt.key === "Enter") {
				this.correct();
			}
		}
	},

	watch: {
		active: {
			handler (active) {
				if (active) {
					document.addEventListener("keydown", this);
				}
				else {
					document.removeEventListener("keydown", this);
				}
			},
			immediate: true
		},

		word: {
			handler (word) {
				this.current_syllable = -1;
			}
		}
	},

	template: `
		<article class="word-card" :class="[word.status, active? 'active' : '']">
			<div class="toolbar">
				<button class="correct" @click="correct" v-if="word.status !== 'correct'" title="Read correctly! (⏎)">✓</button>
				<div class="spacer"></div>
				<button class="speak" @click.stop="speak(current_syllable === -1 ? word.word : syllables[current_syllable])">🗣️</button>
				<div class="spacer"></div>
				<button class="next-word" @click.stop="next_word" title="Next word (⇧→)">▶▶</button>
			</div>
			<h2>
				<button title="Previous syllable (←)" class="previous-syllable" @click="previous_syllable">◀</button>
				<div class="word">
					<span class="syllable" v-for="(syllable, i) in syllables" :class="{active: i === current_syllable}">
						<span v-for="(letter, j) in syllable" class="letter" :class="{vowel: is_vowel(letter, {previous: syllable[j - 1] ?? syllables[i - 1]?.at(-1) })}" @click="speak(letter)">{{ letter }}</span>
					</span>
				</div>
				<div class="word en" v-if="word.status == 'correct'">{{ word.en }}</div>
				<button title="Next syllable (→)" class="next-syllable" @click="next_syllable">▶</button>
			</h2>
			<div class="photos" v-if="word.photos && word.status === 'correct'" :style="{ '--total-aspect-ratio': word.photos.reduce((a, c) => a + c.width / c.height, 0) || 4 }">
				<img v-for="photo in word.photos" :src="photo.urls.small" :alt="photo.description"
				:style="{ '--color': photo.color, '--aspect-ratio': photo.width / photo.height }" />
			</div>
		</article>
	`
}

function dropAccents (word = this.word.word) {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}