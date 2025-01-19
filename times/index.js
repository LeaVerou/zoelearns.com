import Vue from "../common/vue.js";
import settings from "../common/settings/index.js";
import local from "../common/local/index.js";
import {
	amount,
	log,
	ceil,
} from "../common/util.js";

let { createApp } = Vue;
let { promise: mountedPromise, resolve: mountedDone } = Promise.withResolvers();

globalThis.app = createApp({
	data () {

		return {
			answers: {},
			row: 0,
			col: 0,
			default_settings: {
				max: 10,
				error_delay: 1,
			},
			typing: 0,
			mountedDone: mountedPromise,
		}
	},

	mixins: [
		local("answers", "row", "col"),
		settings,
	],

	mounted() {
		// Stored state
		if (this.col > 0 || this.row > 0) {
			this.focus(this.row, this.col);
		}

		mountedDone();
	},

	computed: {
		max () {
			return this.settings.max;
		},

		/**
		 * The status of each answer
		 * @property { Object<number, Object<number, boolean | undefined>> }
		*/
		correct () {
			let ret = {};

			for (let m = 1; m <= this.max; m++) {
				let statuses = ret[m] = {};
				this.answers[m] ??= {};

				for (let n = 1; n <= this.max; n++) {
					let answer = this.answers[m][n];

					if (answer) {
						statuses[n] = answer.trim() == m * n ? true : false;
					}
				}
			}

			return ret;
		},

		/**
		 * The number of correct answers over the total number of answers
		 * @property { number }
		 */
		progress () {
			let correct = Object.values(this.correct).map(Object.values).flat().filter(Boolean).length;
			return correct / (this.max ** 2);
		}
	},

	watch: {
		max: {
			handler (max, oldMax) {
				if (max > oldMax) {
					for (let i = oldMax + 1; i <= max; i++) {
						this.answers[i] ??= {};
					}
				}
			},
			immediate: true,
		},

		progress: {
			async handler (progress) {
				await this.mountedDone;

				if (progress >= 1) {
					this.$refs.successDialog.showModal();
				}
			},
			immediate: true,
		}
	},

	methods: {
		amount,
		log,
		ceil,

		focus (row, col) {
			this.getInput(row, col).focus();
		},

		refresh_class (element, className) {
			if (!element.classList.contains(className)) {
				return;
			}

			element.classList.remove(className);
			setTimeout(() => element.classList.add(className), 100);
		},

		/**
		 * Move focus relative, wrapping at the ends
		 */
		move (rowRelative, colRelative) {
			let { row, col } = this;
			row += rowRelative;
			col += colRelative;

			row = (row + this.max) % this.max || this.max;
			col = (col + this.max) % this.max || this.max;
			this.focus(row, col);
		},

		/** Get a ref to the input field that corresponds to a row & col */
		getInput (row, col) {
			// this.$refs.input is a one dimensional array of inputs ordered by row
			// so we need to calculate the index of the input in the array
			let input = this.$refs.input[(row - 1) * this.max + col - 1];
			if (!input) {
				console.warn(`No <input> found for ${row} x ${col}`, "$refs:", this.$refs.input);
			}
			return input;
		},

		handleKeydown (e) {
			this.typing++;

			setTimeout(() => {
				if (this.typing > 0) {
					this.typing--;
				}
			}, this.settings.error_delay * 1000);

			if (e.key.startsWith("Arrow")) {
				let relativeRow = 0;
				let relativeCol = 0;

				if (e.key === "ArrowUp") {
					relativeRow--;
				}
				else if (e.key === "ArrowDown") {
					relativeRow++;
				}
				else if (e.target.selectionStart === e.target.selectionEnd) { // no selection
					if (e.key === "ArrowLeft") {
						// Make sure it's not to move the caret

						if (e.target.selectionStart === 0) {
							relativeCol--;
						}
					}
					else if (e.key === "ArrowRight") {
						// Make sure it's not to move the caret
						if (e.target.selectionEnd === e.target.value.length) {
							relativeCol++;
						}
					}
				}


				if (relativeRow || relativeCol) {
					e.preventDefault();
					this.move(relativeRow, relativeCol);
				}
			}
		},
	},
}).mount(document.body);
