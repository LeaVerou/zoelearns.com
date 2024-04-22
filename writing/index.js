import Vue from "../common/vue.js";
import settings from "../common/settings.js";

let { createApp, nextTick } = Vue;

globalThis.app = createApp({
	data () {
		return {
			lettersSource: "A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, I, i, J, j, K, k, L, l, M, m, N, n, O, o, P, p, Q, q, R, r, S, s, T, t, U, u, V, v, W, w, X, x, Y, y, Z, z",
			// size: 36,
			lines_per_page: 12,
			repetitions: 1,
			page_size: "letter",
			orientation: "portrait",
			show_settings: false,
			default_settings: {

			},
		}
	},

	mixins: [
		settings
	],

	computed: {
		letters () {
			return this.lettersSource.split(",").map(letter => letter.trim()).filter(Boolean);
		},
		lettersDrawn () {
			return this.letters.flatMap(letter => Array(this.repetitions).fill(letter));
		},
		pageHeight () {
			// pt to inches * height in inches * % of page that is not margin
			return 72 * (this.page_size === "letter" ? 11 : 297 / 25.4) * .9;
		},
		size () {
			// lines_per_page = this.pageHeight / (this.size * 1.3)
			let lines = Math.min(this.lines_per_page, this.lettersDrawn.length + 1);
			return Math.floor(this.pageHeight / (lines * 1.3));
		},
		// lines_per_page () {
		// 	return this.pageHeight / (this.size * 1.3);
		// },
		pages () {
			let { lettersDrawn, lines_per_page } = this;

			let pageCount = Math.ceil(lettersDrawn.length / lines_per_page);
			let ret = [];
			for (let i=0; i<pageCount; i++) {
				ret.push(lettersDrawn.slice(i * lines_per_page, (i+1) * lines_per_page));
			}
			return ret;
		},
	},

	watch: {
		lines_per_page: {
			handler (value) {
				document.documentElement.style.setProperty("--lines-per-page", value);
			},
			immediate: true
		},
		size: {
			handler (value) {
				document.documentElement.style.setProperty("--size", this.size);
			},
			immediate: true
		},
		page_size: {
			handler (value) {
				document.documentElement.style.setProperty("--page-size", value);
			},
			immediate: true
		},
		orientation: {
			handler (value) {
				document.documentElement.style.setProperty("--orientation", value);
			},
			immediate: true
		},
	},

	methods: {
		print() {
			window.print();
		},
		// async updateLineHeight () {
		// 	await nextTick();
		// 	this.lineHeight = document.querySelector(".letter-line")?.offsetHeight;
		// }
	},
}).mount(document.body);