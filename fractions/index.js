import Vue from "../common/vue.js";
import settings from "../common/settings.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			numerator: 2,
			denominator: 3,
			show_settings: false,
			default_settings: {
				pie_hue: 340,
				pie_background_hue: 90,
			},
		}
	},

	mixins: [
		settings
	],

	computed: {
		fraction () {
			return this.numerator / this.denominator;
		},

		pies () {
			return Math.max(1, Math.ceil(this.fraction));
		},

		full_pies () {
			return Math.floor(this.fraction);
		},

		pies_x () {
			return Math.max(1, Math.ceil(Math.sqrt(this.pies)));
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
				"--pie-hue": this.settings.pie_hue,
				"--pie-background-hue": this.settings.pie_background_hue,
			}
		}
	},

	watch: {

	}
}).mount(document.body);