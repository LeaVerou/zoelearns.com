import Color from "https://colorjs.io/color.js";

import $ from "https://v2.blissfuljs.com/src/$.js";
import $$ from "https://v2.blissfuljs.com/src/$$.js";
import create from "https://v2.blissfuljs.com/src/dom/create.js";
import style from "https://v2.blissfuljs.com/src/dom/style.js";

import languages from "./languages.js";
let languageCodes = Object.keys(languages);

const seconds = s => new Promise(resolve => setTimeout(resolve, s * 1000));

// Setup
const main = $("main");
let words = $$(".word");

for (let i=1; i<=9; i++) {
	create({
		tag: "button",
		className: "number",
		style: {
			"--number": i,
			"--color": getColor(i).toString({fallback: true})
		},
		textContent: i,
		inside: main
	});
}

for (let i=0; i<languageCodes.length; i++) {
	let code = words[i].lang = languageCodes[i];
	let settings = languages[code];
	style(words[i], "--flag", `"${settings.flag}"`);

	if (settings.audio) {
		create("audio", {
			src: `./audio/${settings.audio.src}`,
			id: "audio-" + code,
			properties: {
				times: settings.audio.times
			},
			// hidden: true,
			controls: true,
			inside: document.body
		});
	}
}

document.addEventListener("click", evt => {
	if (evt.target.matches("button.number")) {
		showNumber(evt.target);
	}
});

function getColor(number) {
	let hue = 40 * (number - 1);
	return new Color("lch", [60, 60, hue]);
}

async function showNumber(button) {
	let i = +button.textContent;
	let dialog = number;
	let rect = button.getBoundingClientRect();
	let cs = getComputedStyle(button);

	style(dialog, {
		"--color": cs.backgroundColor,
		"--top": rect.top,
		"--right": rect.right,
		"--bottom": rect.bottom,
		"--left": rect.left,
		"--width": rect.width,
		"--height": rect.height,
	});

	$(".number", dialog).textContent = button.textContent;

	languageCodes.map((code, j) => {
		let name = languages[code].names[i];
		words[j].textContent = name;
	});

	let objects = $(".objects");

	Array(i).fill().map(x => create({
		inside: objects
	}));

	// button.append(dialog);
	dialog.showModal();

	await seconds(.05);

	dialog.classList.add("expanded");

	await seconds(1);

	for (let code of languageCodes) {
		await speak(i, code);
	}
}

number.addEventListener("close", evt => {
	$(".objects").textContent = "";
	evt.target.classList.remove("expanded");
});

async function speak(i, code="en") {
	let settings = languages[code];
	let audio = $("audio#audio-" + code);

	if (!audio || !settings.audio) {
		return false;
	}

	let start = settings.audio.times[i];
	let end = settings.audio.times[i + 1] || audio.duration;
	audio.currentTime = start;

	await audio.play();

	let word = $(`.word[lang=${code}]`);
	word?.classList.add("speaking");

	await seconds(end - start);

	audio.pause();
	word?.classList.remove("speaking");

	return true;
}

self.speak = speak;
