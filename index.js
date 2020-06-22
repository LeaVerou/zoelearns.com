import Color from "https://colorjs.io/color.js";
import "https://blissfuljs.com/bliss.js";

const $ = Bliss;

let playing = true;

document.oncontextmenu = evt => {
	if (playing) {
		evt.preventDefault();
	}
};

document.onkeyup = evt => {
	if (evt.key === "F" && evt.metaKey && evt.shiftKey) {
		playing = !playing;
		document.documentElement.classList.toggle("playing", playing);
	}

	if (playing) {
		evt.preventDefault();
	}
};

document.onkeydown = evt => {
	switch (evt.key) {
		case " ":
			Promise.all($.transition($.$("*", word), {opacity: 0}, 400)).then(() => {
				word.textContent = "";
			});

			return;
		case "Backspace":
		case "Escape":
			word.lastElementChild?.remove();
			return;
	}


	let isLetter = /^\p{Letter}$/ui.test(evt.key);
	let isNumber = /^\p{Number}$/ui.test(evt.key);

	if (isLetter || isNumber) {
		let hue, color, classes, style;

		if (isLetter) {
			hue = (evt.keyCode - 65) * 12;
			color = new Color("lch", [60, 80, hue]);
			classes = `letter letter-${evt.key}`;
			style = {"--code": evt.keyCode};
		}
		else if (isNumber) {
			hue = (evt.keyCode - 65) * 36;
			color = new Color("lch", [70, 90, hue]);
			classes = `number number-${evt.key}`;
			style = {"--number": evt.key}
		}

		let colorStr = color.toString({fallback: true});

		$.create("span", {
			className: classes,
			style: {
				...style,
				"--color": colorStr,
				"--hue": hue
			},
			textContent: evt.key,
			inside: word
		});
	}
};
