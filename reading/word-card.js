import getPhotos from "../common/get-photos.js";

export default {
	props: {
		state: Object,
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
		},

		lang () {
			return this.state.lang;
		},

		settings () {
			return this.state.settings;
		}
	},

	methods: {
		is_vowel (letter, o) {
			return this.lang.is_vowel(letter, o);
		},

		segment (word = this.word) {
			return this.lang.segment(word);
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

		handleEvent (evt) {
			if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
				this.previous_segment();
			}
			else if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
				if (evt.shiftKey) {
					if (this.word.status === "correct" || evt.ctrlKey) {
						this.next_word();
					}
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
				<button class="correct bi bi-check-lg" @click="correct" v-if="word.status !== 'correct'" title="Mark as correct (⏎)"></button>

				<div class="spacer"></div>
				<button class="speak bi bi-chat-text-fill" @click.stop="lang.speak(current_segment === -1 ? word.word : segments[current_segment])"></button>
				<div class="spacer"></div>
				<button class="next-word bi bi-skip-end-fill" v-if="word.status === 'correct'" @click.stop="next_word" title="Next word (⇧→)"></button>
				<button class="skip-word bi bi-fast-forward-fill" v-else @click.stop="next_word" title="Skip word (⌃⇧→)"></button>
			</div>
			<h2>
				<button :title="\`Previous \${ lang.segment_name } (←)\`" class="previous-segment bi bi-caret-left-fill" @click="previous_segment"></button>
				<div class="word" :lang="lang.code">
					<span class="segment" v-for="(segment, i) in segments" :class="{active: i === current_segment}">
						<span v-for="(letter, j) in segment" class="letter" :class="{vowel: is_vowel(letter, {previous: segment[j - 1] ?? segments[i - 1]?.at(-1) })}"
						@click="lang.speak(letter)">{{ letter }}</span>
					</span>
				</div>
				<div class="word en" v-if="settings.show_en && word.status == 'correct' && word.en">{{ word.en }}</div>
				<button :title="\`Next \${ lang.segment_name } (→)\`" class="next-segment bi bi-caret-right-fill" @click="next_segment"></button>
			</h2>
			<div class="photos" v-if="word.photos && word.status === 'correct'" :style="photo_container_styles">
				<img v-for="photo in word.photos" :src="photo.urls.small" :alt="photo.description"
				:style="{ '--color': photo.color, '--aspect-ratio': photo.width / photo.height }" />
			</div>
		</article>
	`
}