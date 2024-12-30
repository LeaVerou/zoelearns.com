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

	let {paths, deep = true, immediate, localStorageKey = location.pathname.slice(1)} = options;

	if (localStorageKey) {
		localStorage[localStorageKey] ??= "{}";
	}

	let mixin = {
		created() {
			let obj;

			if (localStorageKey) {
				obj = JSON.parse(localStorage[localStorageKey]);
			}
			else {
				obj = localStorage;
			}

			for (let path of paths) {
				if (obj[path]) {
					this[path] = localStorageKey ? obj[path] : JSON.parse(obj[path]);
				}
			}
		},
		watch: {}
	};

	for (let path of paths) {
		mixin.watch[path] = {
			handler (value) {
				if (localStorageKey) {
					let obj = JSON.parse(localStorage[localStorageKey]);
					obj[path] = value;
					localStorage[localStorageKey] = JSON.stringify(obj);
				}
				else {
					localStorage[path] = JSON.stringify(value);
				}
			},
			deep,
			immediate,
		};
	}

	return mixin;
}
