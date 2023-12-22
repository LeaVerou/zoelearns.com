import Vue from "../common/vue.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			numerator: 2,
			denominator: 3,
			pie_hue: 340,
			show_settings: false,
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
				"--numerator-digits": this.numerator.toString().length,
				"--denominator": this.denominator,
				"--denominator-digits": this.denominator.toString().length,
				"--pies": this.pies,
				"--pies-x": this.pies_x,
				"--pies-y": Math.ceil(this.pies / this.pies_x),
				"--pie-hue": this.pie_hue,
			}
		}
	},

	watch: {

	}
}).mount(document.body);