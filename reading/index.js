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
		}
	},

	mounted () {
		this.next_word();
	},

	computed: {
		// all_words_array() {
		// 	return Object.values(this.all_words);
		// }
	},

	methods: {
		next_word (wordOrIndex) {
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
						word = this.unused_words.splice(i, 1)[0];
					}
				}
				else {
					// Pick a random word
					i = Math.floor(Math.random() * this.unused_words.length);
				}

				word = word ?? this.unused_words.splice(i, 1)[0];
				this.used_words.push(word);
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