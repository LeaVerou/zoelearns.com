import getPhotos from "../util/get-photos.js";

const vowels = "αεηιουω";
const consonants = "βγδζθκλμνξπρσςτφχψ";

export default {
	props: {
		word: Object,
		active: Boolean
	},

	data() {
		return {
			current_syllable: -1,
			status: "",
			photos: []
		}
	},

	computed: {
		syllables () {
			return this.word.syllables ?? this.syllabize(this.word.word);
		},

		normalizedWord () {
			return this.dropAccents(this.word.word);
		}
	},

	methods: {
		dropAccents (word = this.word.word) {
			return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		},

		syllabize (word = this.word.word) {
			let syllables = [];
			let syllable = "";

			// Drop accents
			let normalizedWord = this.dropAccents(word);

			for (let i = 0; i < normalizedWord.length; i++) {
				let letter = normalizedWord[i];
				let originalLetter = word[i];
				syllable += originalLetter;

				if (vowels.includes(letter)) {
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
			this.status = "correct";
			this.photos = (await getPhotos(this.word.en, {per_page: 4})).results;
		},

		next_word () {
			this.status ||= "skipped";
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
		}
	},

	template: `
		<article class="word-card" :class="[status, active? 'active' : '']">
			<div class="toolbar">
				<button title="Previous syllable" class="previous" @click="previous_syllable">◀</button>
				<div class="spacer"></div>
				<button class="correct" @click="correct" v-if="status !== 'correct'">✓</button>
				<button class="next-word" @click.stop="next_word">▶▶</button>
				<button class="speak" @click.stop="speak(current_syllable === -1 ? word.word : syllables[current_syllable])">🗣️</button>
				<div class="spacer"></div>
				<button title="Next syllable" class="next">▶</button>

			</div>
			<h2 class="word">
				<span class="syllable" v-for="(syllable, i) in syllables" :class="{active: i === current_syllable}">
					<span v-for="letter in syllable" class="letter" @click="speak(letter)"
					:style="{'--index': letter.charCodeAt(0) - 'α'.charCodeAt(0)}">{{ letter }}</span>
				</span>
			</h2>
			<div class="photos" v-if="status === 'correct'" :style="{ '--total-aspect-ratio': photos.reduce((a, c) => a + c.width / c.height, 0) || 4 }">
				<img v-for="photo in photos" :src="photo.urls.small" :alt="photo.description"
				:style="{ '--color': photo.color, '--aspect-ratio': photo.width / photo.height }" />
			</div>
		</article>
	`
}