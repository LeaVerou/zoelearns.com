const Self = class extends HTMLElement {
	static url = import.meta.url;

	constructor() {
		super();

		let Self = this.constructor;

		if (this.shadowStyle !== false) {
			this.attachShadow({ mode: "open" });
			this.shadowStyle = typeof this.shadowStyle === "string" ? this.shadowStyle : Self.tagName + ".css";
			this.shadowRoot.innerHTML = `<link href="${ new URL(this.shadowStyle, Self.url) }" rel="stylesheet">
			${Self.shadowTemplate ?? ""}`;

			let namedElements = this.shadowRoot.querySelectorAll("[id], [class], [part]");
			if (namedElements.length > 0) {
				this.el = {};
			}
			for (let el of namedElements) {
				if (el.id) {
					this.el[el.id] = el;
				}

				if (el.part) {
					this.el.parts ??= {};
					this.el.parts[el.part] ??= [];
					this.el.parts[el.part].push(el);
				}

				if (el.className) {
					this.el.classes ??= {};

					for (let className of el.classList) {
						this.el.classes[className] ??= [];
						this.el.classes[className].push(el);
					}
				}
			}
		}
	}

	get numerator () {
		return getComputedStyle(this).getPropertyValue("--numerator") || undefined;
	}

	get denominator () {
		return getComputedStyle(this).getPropertyValue("--denominator") || undefined;
	}

	get maxNumerator () {
		return getComputedStyle(this).getPropertyValue("--max-numerator") || undefined;
	}

	get maxDenominator () {
		return getComputedStyle(this).getPropertyValue("--max-denominator") || undefined;
	}

	static observedAttributes = ["fraction", "max"];
	async attributeChangedCallback (name, oldValue, newValue) {
		let render = false;

		if (!name || name === "fraction" && oldValue !== newValue) {
			let value = name ? newValue : this.getAttribute("fraction");
			let [numerator, denominator] = value.split("/");

			if (numerator) {
				this.style.setProperty("--numerator", numerator);
			}
			else {
				this.style.removeProperty("--numerator");
			}

			if (denominator) {
				this.style.setProperty("--denominator", denominator);
			}
			else {
				this.style.removeProperty("--denominator");
			}

			render = true;
		}

		if (!name || name === "max" && oldValue !== newValue) {
			let value = name ? newValue : this.getAttribute("max");
			let [maxNumerator, maxDenominator] = value.split("/");

			if (maxNumerator) {
				this.style.setProperty("--max-numerator", maxNumerator);
			}
			else {
				this.style.removeProperty("--max-numerator");
			}

			if (maxDenominator) {
				this.style.setProperty("--max-denominator", maxDenominator);
			}
			else {
				this.style.removeProperty("--max-denominator");
			}

			render = true;
		}

		if (render) {
			this.render?.();
		}
	}

	static define(registry = customElements) {
		registry.define(this.tagName, this);
	}
};

export default Self;
