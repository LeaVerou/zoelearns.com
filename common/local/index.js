/**
 * Settings mixin for Vue apps or components
 */

export const defaultPrefix = location.pathname !== "/" ? location.pathname.slice(1).replace(/\/?$/, "/") : "";

export default function getMixin(...args) {
	let options = args[0];

	if (args.length > 1 || typeof options === "string") {
		options = { paths: args };
	}

	if (!Array.isArray(options.paths)) {
		options.paths = [...args.paths];
	}

	let { paths, deep = true, immediate, prefix = defaultPrefix, emptyValue } = options;

	let mixin = {
		created() {
			for (let path of paths) {
				let key = prefix + path;

				if (localStorage[key]) {
					// TODO recursive if it has . in it
					this[path] = JSON.parse(localStorage[key]);
				}
			}
		},
		watch: {}
	};

	for (let path of paths) {
		mixin.watch[path] = {
			handler (value) {
				let key = prefix + path;
				if (value === emptyValue) {
					delete localStorage[key];
				}
				else {
					localStorage[key] = JSON.stringify(value);
				}

			},
			deep,
			immediate,
		};
	}

	return mixin;
}
