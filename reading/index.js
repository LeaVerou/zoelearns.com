import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import WordCard from "./word-card.js";

const vowels = "αεηιουω";
const consonants = "βγδζθκλμνξπρσςτφχψ";
const all_words = await (await fetch("words.json")).json();

for (let word in all_words) {
	all_words[word].word = word;
}

globalThis.app = createApp({
	data() {
		let all_words_array = Object.values(all_words);

		return {
			all_words: all_words_array,
			unused_words: all_words_array.slice(),
			used_words: [],
			activeWord: null
		}
	},

	mounted () {
		if (location.hash) {
			let word = decodeURIComponent(location.hash.slice(1));
			this.next_word(word);
		}
		else {
			this.next_word();
		}

	},

	computed: {
		skipped_words () {
			return this.used_words.filter(w => w?.status === "skipped");
		},

		correct_words () {
			return this.used_words.filter(w => w?.status === "correct");
		}
	},

	methods: {
		next_word (wordOrIndex) {
			console.log(wordOrIndex)
			if (this.activeWord) {
				this.used_words.push(this.activeWord);
			}

			this.activeWord = null;

			if (this.used_words.length < this.all_words.length) {
				let i, word;

				if (typeof wordOrIndex === "number") {
					i = wordOrIndex;
				}
				else if (wordOrIndex) {
					i = this.unused_words.findIndex(word => word.word === wordOrIndex);

					if (i === -1) {
						// what if the word we want to read is used?
						i = this.used_words.findIndex(word => word.word === wordOrIndex);
						this.activeWord = this.unused_words.splice(i, 1)[0];
					}
				}
				else {
					// Pick a random word
					i = Math.floor(Math.random() * this.unused_words.length);
				}

				this.activeWord = this.activeWord ?? this.unused_words.splice(i, 1)[0];
			}
			else {
				// TODO communicate that we ran out of words
			}
		},
	},

	components: {
		"word-card": WordCard
	},

	isCustomElement: tag => {
		return !(tag in this.components)
	}
}).mount(document.body);