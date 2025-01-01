/**
 * Settings mixin for Vue apps or components
 */

export default function getMixin(...args) {
	let options = args[0];

	if (args.length > 1 || typeof options === "string") {
		options = { paths: args };
	}

	if (!Array.isArray(options.paths)) {
		options.paths = [...args.paths];
	}

	let {
		paths, deep = true, immediate,
		prefix = location.pathname !== "/" ? location.pathname.slice(1).replace(/\/?$/, "/") : "",
	} = options;

	let mixin = {
		created() {
			for (let path of paths) {
				let key = prefix + path;
				if (localStorage[key]) {
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
				if (value === undefined) {
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
