import getPhotos from "../util/get-photos.js";
import {
	is_vowel,
	segment_phonemes,
	segment_syllables
} from "./util.js";

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
			current_segment: -1,
		}
	},

	computed: {
		segments () {
			return this.segment(this.word);
		},

		photo_container_styles () {
			let aspectRatios = this.word.photos.map(photo => photo.width / photo.height);
			let ret = Object.fromEntries(aspectRatios.map((ar, i) => [`--aspect-ratio-${ i + 1 }`, ar]));
			return ret;
		}
	},

	methods: {
		is_vowel (letter, o) {
			return is_vowel(Lang, letter, o);
		},

		segment (word = this.word) {
			if (word?.segments) {
				return word.segments;
			}

			word = word?.word ?? word;

			if (Lang.segment) {
				return Lang.segment(word);
			}

			if (Lang.READING_GRANULARITY === "grapheme") {
				return [...segmenter.segment(word)].map(s => s.segment);
			}
			if (Lang.READING_GRANULARITY === "phoneme") {
				return segment_phonemes(Lang, word);
			}
			else if (Lang.READING_GRANULARITY === "syllable") {
				return segment_syllables(Lang, word);
			}
			else { // whole word
				return [word];
			}
		},

		goto_segment (offset) {
			let newIndex = this.current_segment + offset;

			if (newIndex === this.segments.length) {
				newIndex = -1;
			}
			else if (newIndex < 0) {
				newIndex = this.segments.length + 1 + newIndex;
			}

			this.current_segment = newIndex;
		},

		previous_segment () {
			return this.goto_segment(-1);
		},

		next_segment () {
			return this.goto_segment(1);
		},

		async correct () {
			// Remove active segment, if present
			this.current_segment = -1;
			this.word.status = "correct";
			this.word.photos = (await getPhotos(this.word.en ?? this.word.word, {per_page: 4})).results;
		},

		next_word () {
			this.word.status ||= "skipped";
			this.$emit("next_word");
		},

		speak (word) {
			let utterance = new SpeechSynthesisUtterance(word);
			utterance.lang = Lang.code;
			utterance.rate = .8;
			speechSynthesis.speak(utterance);
		},

		handleEvent (evt) {
			if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
				this.previous_segment();
			}
			else if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
				if (evt.shiftKey) {
					this.next_word();
				}
				else {
					this.next_segment();
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
				this.current_segment = -1;
			}
		}
	},

	template: `
		<article class="word-card" :class="[word.status, active? 'active' : '', segments.length > 1? '' : 'no-segments']">
			<div class="toolbar">
				<button class="correct" @click="correct" v-if="word.status !== 'correct'" title="Read correctly! (⏎)">✓</button>
				<div class="spacer"></div>
				<button class="speak" @click.stop="speak(current_segment === -1 ? word.word : segments[current_segment])">🗣️</button>
				<div class="spacer"></div>
				<button class="next-word" @click.stop="next_word" title="Next word (⇧→)">▶▶</button>
			</div>
			<h2>
				<button title="Previous segment (←)" class="previous-segment" @click="previous_segment">◀</button>
				<div class="word" lang="${ Lang.code }">
					<span class="segment" v-for="(segment, i) in segments" :class="{active: i === current_segment}">
						<span v-for="(letter, j) in segment" class="letter" :class="{vowel: is_vowel(letter, {previous: segment[j - 1] ?? segments[i - 1]?.at(-1) })}" @click="speak(letter)">{{ letter }}</span>
					</span>
				</div>
				<div class="word en" v-if="word.status == 'correct' && word.en">{{ word.en }}</div>
				<button title="Next segment (→)" class="next-segment" @click="next_segment">▶</button>
			</h2>
			<div class="photos" v-if="word.photos && word.status === 'correct'" :style="photo_container_styles">
				<img v-for="photo in word.photos" :src="photo.urls.small" :alt="photo.description"
				:style="{ '--color': photo.color, '--aspect-ratio': photo.width / photo.height }" />
			</div>
		</article>
	`
}