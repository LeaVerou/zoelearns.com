import Vue from "../common/vue.js";
import settings from "../common/settings/index.js";
import local from "../common/local/index.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			answers: {},
			row: 0,
			col: 0,
			default_settings: {
				max: 10
			}
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
	},

	computed: {
		max() {
			return this.settings.max;
		},
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
			immediate: true
		}
	},

	methods: {
		focus (row, col) {
			this.getInput(row, col).focus();
		},

		/**
		 * Move focus relative, wrapping at the ends
		 */
		move (rowRelative, colRelative) {
			let { row, col } = this;
			row += rowRelative;
			col += colRelative;
			row = (row + this.max) % this.max;
			col = (col + this.max) % this.max;
			this.focus(row, col);
		},

		/** Get a ref to the input field that corresponds to a row & col */
		getInput (row, col) {
			// this.$refs.input is a one dimensional array of inputs ordered by row
			// so we need to calculate the index of the input in the array
			return this.$refs.input[--row * this.max + --col];
		},

		handleKeydown (e) {
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
