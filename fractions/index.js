import Vue from "../common/vue.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			numerator: 2,
			denominator: 3,
		}
	},

	computed: {
		fraction () {
			return this.numerator / this.denominator;
		},

		pies () {
			return Math.ceil(this.fraction);
		},

		full_pies () {
			return Math.floor(this.fraction);
		},

		pies_x () {
			return Math.ceil(Math.sqrt(this.pies));
		},

		app_styles () {
			return {
				"--numerator": this.numerator,
				"--denominator": this.denominator,
				"--pies": this.pies,
				"--pies-x": this.pies_x,
				"--pies-y": Math.ceil(this.pies / this.pies_x),
			}
		}
	},
}).mount(document.body);