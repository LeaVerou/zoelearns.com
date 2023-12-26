import getPhotos from "../util/get-photos.js";
import { dropAccents, isVowel, syllabify } from "./util.js";

let params = new URLSearchParams(location.search);
let lang_code = params.get("lang") ?? "el";
const Lang = await import(`./langs/${ lang_code }/lang.js`);

let segmenter;

if (Lang.READING_GRANULARITY === "grapheme") {
	segmenter = new Intl.Segmenter(Lang.code, {granularity: "grapheme"});
}

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
			if (Lang.READING_GRANULARITY === "grapheme") {
				return [...segmenter.segment(this.word.word)].map(s => s.segment);
			}
			else if (Lang.READING_GRANULARITY === "syllable") {
				return this.word.syllables ?? this.syllabify(this.word.word);
			}
			else { // whole word
				return [this.word.word];
			}
		},
	},

	methods: {
		is_vowel (letter, o) {
			return isVowel(Lang, letter, o);
		},

		syllabify (word = this.word.word) {
			return syllabify(Lang, word);
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