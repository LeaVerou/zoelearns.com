import Color from "https://colorjs.io/color.js";

import $ from "https://v2.blissfuljs.com/src/$.js";
import $$ from "https://v2.blissfuljs.com/src/$$.js";
import create from "https://v2.blissfuljs.com/src/dom/create.js";
import style from "https://v2.blissfuljs.com/src/dom/style.js";

if (!self.HTMLDialogElement) {
	import("https://cdn.jsdelivr.net/npm/dialog-polyfill").then(() => {
		dialogPolyfill.registerDialog(number);
	});
}

import languages from "./languages.js";
let languageCodes = Object.keys(languages);

const seconds = s => new Promise(resolve => setTimeout(resolve, s * 1000));

// Setup
const main = $("main");
const objects = $(".objects");

let words = $$(".word");
let shownNumber;

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
		settings.audio.element = create("audio", {
			src: `./audio/${settings.audio.src}`,
			id: "audio-" + code,
			properties: {
				times: settings.audio.times
			},
			hidden: true,
			// controls: true,
			inside: document.body
		});
	}
}

// To remove toolbar on iPhone
scrollTo(0, 1);

document.addEventListener("click", evt => {
	if (evt.target.matches("button.number")) {
		showNumber(evt.target);
	}
});

navigator.keyboard?.lock();

document.addEventListener("keyup", evt => {
	evt.preventDefault();

	if (/^\d$/.test(evt.key)) {
		showNumber(main.children[evt.key - 1]);
	}
});

function getColor(number) {
	let hue = 40 * (number - 1);
	return new Color("lch", [60, 60, hue]);
}

async function showNumber(button) {
	if (number.open) {
		await closeDialog({immediate: true});
	}

	let i = +button.textContent;
	let dialog = number;
	let rect = button.getBoundingClientRect();
	let cs = getComputedStyle(button);

	shownNumber = i;

	style(dialog, {
		"--color": cs.backgroundColor,
		"--number": i
	});

	for (let prop in rect) {
		if (typeof rect[prop] === "number") {
			style(dialog, "--" + prop, rect[prop]);
		}
	}

	$(".number", dialog).textContent = button.textContent;

	languageCodes.map((code, j) => {
		let name = languages[code].names[i];
		words[j].textContent = name;
		words[j].onclick = e => count(code);
	});

	Array(i).fill().map((x, i) => create({
		style: {
			"--index": i
		},
		onclick: async e => {
			for (let code of languageCodes) {
				await countOne(i + 1, code);
			}
		},
		inside: objects
	}));

	// button.append(dialog);
	dialog.showModal();

	await seconds(.05);

	dialog.classList.add("expanded");

	await seconds(.4);

	fitObjects(objects);

	await seconds(.6);

	await speakAll(i);

	await countAll();
}

async function closeDialog({immediate} = {}) {
	number.classList.remove("expanded");

	if (number.open) {
		if (!immediate) {
			await seconds(.2);
		}

		number.close(shownNumber);
	}

	shownNumber = undefined;

	objects.textContent = "";
	style(objects, "--factor", "initial");
}

number.addEventListener("close", evt => {
	closeDialog();
});

$("#number .close").addEventListener("click", closeDialog);

function updateViewportSize() {
	style(document.documentElement, {
		"--innerwidth": innerWidth / 100 + "px",
		"--innerheight": innerHeight / 100 + "px",
	});
}

updateViewportSize();

addEventListener("resize", e => {
	if (number.open) {
		fitObjects(objects);
	}

	updateViewportSize();
});

$("#number .number").addEventListener("click", e => {
	let i = +e.target.textContent;
	speakAll(i);
})

function fitObjects (objects) {
	let f = 1;
	style(objects, "--factor", 1);

	while (objects.offsetHeight > innerHeight && f > .1) {
		// Not all objects are visible!
		style(objects, "--factor", f *= .9);
	}
}

async function countOne (i, code = "en") {
	let object = objects.children[i - 1];

	if (!object) {
		return;
	}

	object.classList.add("count");
	let duration = parseInt(getComputedStyle(object).animationDuration);
	await Promise.all([seconds(duration), speak(i, code)]);
	object.classList.remove("count");
}

async function count(code = "en") {
	count.controller?.abort();

	let {signal} = count.controller = new AbortController();

	signal.addEventListener("abort", e => {
		throw new DOMException("Aborted", "AbortError")
	});

	for (let i=1; i<=shownNumber; i++) {
		await countOne(i, code)
	}

	delete count.controller;
}

async function countAll(i) {
	for (let code of languageCodes) {
		try {
			await count(code);
		}
		catch (e) {
			if (e.name !== "AbortError") {
				throw e;
			}
		}
	}
}

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

	let word;

	if (i === shownNumber) {
		word = $(`.word[lang=${code}]`);
		style(word, "--duration", end - start);
		word?.classList.add("speaking");
	}

	await seconds(end - start);

	audio.pause();

	if (i === shownNumber && word) {
		word.classList.remove("speaking");
	}

	return true;
}

async function speakAll(i) {
	for (let code of languageCodes) {
		await speak(i, code);
	}
}

if (screen.lockOrientation) {
	screen.lockOrientation("landscape");
}
