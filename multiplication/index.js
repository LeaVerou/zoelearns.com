import Vue from "../common/vue.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			max: 10,
			answers: {},
			row: 0,
			col: 0,
		}
	},

	computed: {

	},

	watch: {
		max: {
			handler (max) {
				this.answers = Object.fromEntries(Array.from({length: max}, (_, i) => [i + 1, {}]));
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
				else if (e.key === "ArrowLeft") {
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

				if (relativeRow || relativeCol) {
					e.preventDefault();
					this.move(relativeRow, relativeCol);
				}
			}
		},
	},
}).mount(document.body);
