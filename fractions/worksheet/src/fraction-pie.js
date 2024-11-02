import FractionElement from "./FractionElement.js";

const Self = class extends FractionElement {
	static url = import.meta.url;
	static tagName = "fraction-pie";
	static shadowTemplate = `
		<svg viewBox="0 0 100 100" id=svg>
			<circle cx="50" cy="50" r="40" />
		</svg>
	`;

	render () {
		let {denominator, maxDenominator} = this;

		if (denominator > 1) {
			if (!this.solidLine) {
				let line = this.solidLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("x1", 50);
				line.setAttribute("y1", 50);
				line.setAttribute("x2", 50);
				line.setAttribute("y2", 10);
				line.classList.add("solid");
			}
		}
		if (maxDenominator > 1) {
			if (!this.faintLine) {
				let line = this.faintLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("x1", 50);
				line.setAttribute("y1", 50);
				line.setAttribute("x2", 50);
				line.setAttribute("y2", 10);
				line.classList.add("faint");
			}
		}

		if (maxDenominator > 1) {
			let angles = new Set();

			for (let denominator=0; denominator<=maxDenominator; denominator++) {
				let degrees = 360 / denominator;
				for (let i=0; i<denominator; i++) {
					let angle = i * degrees;
					angles.add(angle);
				}
			}

			let lines = this.shadowRoot.querySelectorAll("line.faint");

			let i = 0;
			for (let angle of angles) {
				let line = lines[i] ?? this.el.svg.appendChild(this.faintLine.cloneNode());
				line.style.setProperty("--index", i);
				line.style.setProperty("rotate", angle + "deg");
				i++;
			}
		}

		if (denominator > 1) {
			let degrees = 360 / denominator;
			let lines = this.shadowRoot.querySelectorAll("line.solid");

			for (let i=0; i<denominator; i++) {
				let line = lines[i] ?? this.el.svg.appendChild(this.solidLine.cloneNode());
				line.style.setProperty("--index", i);
				line.style.setProperty("rotate", degrees * i + "deg");
			}
			for (let i=denominator; i<lines.length; i++) {
				lines[i].remove();
			}
		}
	}
};

Self.define();

export default Self;
