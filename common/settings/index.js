import local from "../local/index.js";
/**
 * Settings mixin for Vue apps or components
 */

export default {
	data () {
		return {
			show_settings: false,
			settings: {},
		}
	},

	mixins: [
		local("settings"),
	],

	created () {
		// Apply default settings, if specified
		if (this.default_settings) {
			applyDefaults(this.settings, this.default_settings);
		}
	},
}

function applyDefaults (settings, defaults) {
	if (!defaults || !settings) {
		return settings;
	}

	for (let key in defaults) {
		if (typeof defaults[key] === "object") {
			if (typeof settings[key] === "undefined") {
				settings[key] = {};
			}
			applyDefaults(settings[key], defaults[key]);
		}
		else if (typeof settings[key] === "undefined") {
			settings[key] = defaults[key];
		}
	}
}
