/**
 * Settings mixin for Vue apps or components
 */

export default function getMixin(options) {
	if (typeof options === "string" || Array.isArray(options)) {
		options = { paths: options };
	}

	if (!Array.isArray(options.paths)) {
		options.paths = [options.paths];
	}

	let {paths, deep = true, immediate, localStorage = globalThis.localStorage} = options;
	let mixin = {
		created() {
			for (let path of paths) {
				if (localStorage[path]) {
					this[path] = JSON.parse(localStorage[path]);
				}
			}
		},
		watch: {}
	};

	for (let path of paths) {
		mixin.watch[path] = {
			handler (value) {
				localStorage[path] = JSON.stringify(value);
			},
			deep,
			immediate,
		};
	}

	return mixin;
}
