

 async function importWithFallbacks (...specifiers) {
	for (let i = 0; i < specifiers.length; i++) {
		let specifier = specifiers[i];

		if (typeof specifier !== "string") {
			// This allows us to end the chain with actual data / functions
			return specifier;
		}

		try {
			return await import(specifier)
		} catch (error) {
			if (i === specifiers.length - 1) {
				throw error;
			}
		}
	}
}

export default await importWithFallbacks(
	"../node_modules/vue/dist/vue.esm-browser.js",
	"https://unpkg.com/vue@3/dist/vue.esm-browser.js"
);
