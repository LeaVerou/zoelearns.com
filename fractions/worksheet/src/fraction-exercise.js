import FractionElement from "./FractionElement.js";
import "./fraction-write.js";
import "./fraction-pie.js";

const Self = class extends FractionElement {
	static url = import.meta.url;
	static tagName = "fraction-exercise";
	static shadowTemplate = `
		<fraction-write></fraction-write>
		<div id="pies"><fraction-pie></fraction-pie></div>
	`;

	connectedCallback () {
		this.render();
	}

	render () {
		let max = Math.ceil((this.maxNumerator ?? 1) / (this.maxDenominator ?? 1));
		let pies = this.el.pies.children;

		if (max < pies.length) {
			for (let i=pies.length-1; i>=max; i--) {
				this.el.pies.removeChild(pies[i]);
			}
		}
		else if (max > pies.length) {
			for (let i=pies.length; i<max; i++) {
				let pie = document.createElement("fraction-pie");
				this.el.pies.appendChild(pie);
			}
		}

		for (let pie of this.el.pies.children) {
			pie.render();
		}

		this.rendered = true;
	}
};

Self.define();

export default Self;
