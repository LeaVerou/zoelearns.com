import FractionElement from "./FractionElement.js";

const Self = class extends FractionElement {
	static url = import.meta.url;
	static tagName = "fraction-write";
	static shadowTemplate = `<hr>`;
};

Self.define();

export default Self;
