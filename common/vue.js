import { importWithFallbacks } from "./util.js";

export default await importWithFallbacks(
	"../node_modules/vue/dist/vue.esm-browser.js",
	"https://unpkg.com/vue@3/dist/vue.esm-browser.js"
);