import Vue from "../common/vue.js";
// import settings from "../common/settings.js";
let { createApp, nextTick } = Vue;
import presets, { string_to_lines } from "./presets.js";

function root_css_property (name, property) {
	if (arguments.length === 1) {
		if (Array.isArray(name)) {
			let ret = name.reduce((acc, key) => {
				Object.assign(acc, root_css_property(key));
				return acc;
			}, {});
			console.log(ret)
			return ret;
		}
		else if (typeof name === "object") {
			return Object.entries(name).reduce((acc, [key, value]) => {
				Object.assign(acc, root_css_property(key, value));
				return acc;
			}, {});
		}
	}

	property ??= "--" + name.replaceAll("_", "-");

	return {
		[name]: {
			handler (value) {
				document.documentElement.style.setProperty(property, value);
			},
			immediate: true
		}
	}
}

function root_class (name, prefix) {
	if (arguments.length === 1) {
		if (Array.isArray(name)) {
			let ret = name.reduce((acc, key) => {
				Object.assign(acc, root_class(key));
				return acc;
			}, {});
			console.log(ret)
			return ret;
		}
		else if (typeof name === "object") {
			return Object.entries(name).reduce((acc, [key, value]) => {
				Object.assign(acc, root_class(key, value));
				return acc;
			}, {});
		}
	}

	prefix ??= name.replaceAll("_", "-") + "-";

	return {
		[name]: {
			handler (value, oldValue) {
				console.log(prefix, value, oldValue)
				if (oldValue) {
					let oldClassName = prefix + oldValue;
					console.log(oldClassName);
					document.documentElement.classList.remove(oldClassName);
				}

				let className = prefix + value;
				document.documentElement.classList.add(className);
			},
			immediate: true
		}
	}
}

const sizes = {
	letter: [8.5, 11, "in"],
	A4: [210, 297, "mm"],
}

globalThis.app = createApp({
	data () {
		return {
			lines_string: "A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, I, i, J, j, K, k, L, l, M, m, N, n, O, o, P, p, Q, q, R, r, S, s, T, t, U, u, V, v, W, w, X, x, Y, y, Z, z",
			// size: 36,
			font_family: "handwriting",
			max_lines_per_page: 12,
			page_size: "letter",
			orientation: "portrait",
			empty_lines: 0,
			ghosts: 4,
			quick_langs: ["en"],
			quick_forms: ["upper", "lower"],
		}
	},

	mixins: [
		settings
	],

	computed: {
		lines: {
			get () {
				return string_to_lines(this.lines_string);
			},
			set (lines) {
				this.lines_string = lines.join(", ");
			}
		},

		lines_all () {
			return this.lines.flatMap(letter => [letter].concat(Array(this.empty_lines).fill("")));
		},

		page_height () {
			// pt to inches * height in inches * % of page that is not margin
			let dimensions = sizes[this.page_size];
			let [w, h, unit] = dimensions;

			if (this.orientation === "landscape") {
				[w, h] = [h, w];
			}

			// pt in unit
			let multiplier = unit === "pt" ? 1 : unit === "in" ? 72 : 25.4 / 72;
			let marginBlock = Number(document.documentElement.style.getPropertyValue("--page-margin-block") ?? 0.05);
			let usable_height = h - 2 * marginBlock * h;

			return usable_height * multiplier;
		},

		total_lines () {
			return this.lines.length * (this.empty_lines + 1);
		},

		size () {
			// lines_per_page = this.page_height / (this.size * 1.3)
			let lines = Math.min(this.lines_per_page, this.total_lines + 1);
			return Math.floor(this.page_height / (lines * 1.5));
		},

		lines_per_page () {
			let max_lines_per_page = this.max_lines_per_page;
			let page_count = Math.ceil(this.total_lines / max_lines_per_page);
			return Math.ceil(this.total_lines / page_count);
		},

		pages () {
			let { lines, total_lines, lines_per_page } = this;
			let multiplier = this.empty_lines + 1;
			let source_lines_per_page = Math.floor(lines_per_page / multiplier);
			let pageCount = Math.ceil(total_lines / lines_per_page);
			let ret = [];
			for (let i=0; i<pageCount; i++) {
				ret.push(lines.slice(i * source_lines_per_page, (i + 1) * source_lines_per_page));
			}
			return ret;
		},
	},

	watch: {
		...root_css_property([
			"lines_per_page",
			"size",
			"page_size",
			"orientation",
			"ghosts",
		]),

		...root_class("font_family"),

		quick_langs: {
			handler (langs) {
				this.quick_enter({langs});
			},
			deep: true,
		},

		quick_forms: {
			handler (forms) {
				this.quick_enter({forms});
			},
			deep: true,
		},
	},

	methods: {
		print() {
			window.print();
		},

		character_count (str) {
			this.segmenter ??= new Intl.Segmenter("und", { granularity: "grapheme" });
			const segments = this.segmenter.segment(str);
			return [...segments].length;
		},

		quickEnter (evt) {
			let value = evt?.target?.closest("button-group")?.value;
			console.log(value);
			// let { lang, case: letter_case } = this.quick;
			// letter_case = letter_case.join(",");
			// letter_case = letter_case === "upper,lower" ? "all" : letter_case;
			// this.lines_string = lines[lang][letter_case];
		},

		quick_enter ({
			langs = this.quick_langs,
			forms = this.quick_forms,
		}) {
			let ret = [];

			for (let lang of langs) {
				let lang_chars = [];

				for (let form of forms) {
					let chars = presets[lang]?.[form] ?? presets.en[form];
					lang_chars.push(...chars);
				}

				let collator = new Intl.Collator(lang);
				lang_chars = lang_chars.sort(collator.compare);
				ret.push(...lang_chars);
			}

			// Drop duplicates
			this.lines = [...new Set(ret)];
		}
	},
}).mount(document.body);

