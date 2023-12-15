function render() {
	for (let control of document.querySelectorAll("input")) {
		document.documentElement.style.setProperty("--" + control.id, control.value);
	}

	// We don't handle fractions > 1 yet
	numerator.max = denominator.value;
}

render();
document.documentElement.addEventListener("input", render);