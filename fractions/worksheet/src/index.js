import Vue from "../../../common/vue.js";
import "./fraction-exercise.js";

let { createApp } = Vue;

globalThis.app = createApp({
	data () {
		return {
			exercises: [
				{ fraction: "1/2" },
				{ fraction: "1/3" },
				{ fraction: "/4" },
				{ max: "/6" },
				{ max: "12/6" },
			]
		}
	},

	computed: {

	},

	methods: {
		print() {
			window.print();
		}
	}
}).mount(document.body);
