import Vue from "../common/vue.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			numerator: 2,
			denominator: 3
		}
	}
}).mount(document.body);