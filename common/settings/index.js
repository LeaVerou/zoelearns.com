/**
 * Settings mixin for Vue apps or components
 */

export default {
	data () {
		let settings = localStorage.settings ? JSON.parse(localStorage.settings) : {};

		return {
			show_settings: false,
			settings,
		}
	},

	created () {
		// Apply default settings, if specified
		if (this.default_settings) {
			applyDefaults(this.settings, this.default_settings);
		}
	},

	watch: {
		settings: {
			handler (settings) {
				localStorage.settings = JSON.stringify(settings);
			},

			deep: true,
		}
	}
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
