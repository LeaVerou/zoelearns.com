import Color from "https://colorjs.io/color.js";
import "https://blissfuljs.com/bliss.js";

const $ = Bliss;
const $$ = $.$;
const defer = delay => new Promise(resolve => delay === undefined? requestAnimationFrame(resolve) : setTimeout(resolve, delay));

let playing;

document.oncontextmenu =
document.onkeyup =
document.onclick =
evt => {
	if (playing) {
		evt.preventDefault();
		buffer.focus;
	}
};

async function togglePlaying() {
	playing = !playing;
	document.documentElement.classList.toggle("playing", playing);

	await navigator.keyboard?.[playing? "lock" : "unlock"]();

	showNotice({
		textContent: playing? "Playing" : "Paused",
		className: "play-notice " + (!playing? "not-" : "") + "playing"
	});
}

togglePlaying();

document.addEventListener("keyup", evt => {
	if (evt.key === "1" && (evt.ctrlKey || evt.metaKey) && evt.shiftKey) {
		togglePlaying();
	}
});

document.addEventListener("keydown", evt => {
	if (evt.ctrlKey || evt.metaKey) {
		// Disable built-in shortcuts
		evt.preventDefault();
	}
});

let isLetter = text => /^\p{Letter}$/ui.test(text);
let isNumber = text => /^\p{Number}$/ui.test(text);

buffer.oninput = evt => {
	let {target} = evt;
	let text = target.value;
	let hue, color, classes, style;

	if (isLetter(text)) {
		let code = text.toUpperCase().charCodeAt(0);
		hue = (code % 100) * 30;
		color = new Color("lch", [60, 80, hue]);
		classes = `letter letter-${text}`;
		style = {"--code": code};
	}
	else if (isNumber(text)) {
		hue = text * 36;
		color = new Color("lch", [70, 90, hue]);
		classes = `number number-${text}`;
		style = {"--number": text}
	}
	else if (!/^\p{Lm}|\p{Mc}|\p{Sk}+$/u.test(text)) {
		// Not a modifier, not a letter, not a number, yeet
		target.value = "";
	}

	if (style) {
		let colorStr = color.display();

		$.create("span", {
			className: classes,
			style: {
				...style,
				"--color": colorStr,
				"--hue": hue
			},
			textContent: text,
			inside: word
		});

		target.value = "";
		content.hidden = false;
	}

}

document.addEventListener("focusout", evt => {
	buffer.focus();
});

document.addEventListener("blur", evt => {
	buffer.focus();
}, true);

document.onkeydown = async evt => {
	switch (evt.key) {
		case " ":
		case "Escape":
			clear();
			evt.preventDefault();
			return;
		case "Backspace":
			word.lastElementChild?.remove();
			translation.textContent = "";
			evt.preventDefault();
			return;
		case "Tab":
			buffer.focus();
			evt.preventDefault();
			return;
		case "Enter":
			let text = word.textContent.trim();

			if (isScript("Greek", text)) {
				let textEn = text;
				text = await translate(text);
				translation.textContent = text;
				translation.href = `https://www.wordreference.com/gren/${textEn}`
				translation.hidden = false;
				word.lang = "el";
			}
			else {
				translation.hidden = true;
				word.lang = "en";
			}

			if (text) {
				showPhoto(text);
			}

			evt.preventDefault();
			return;
	}
};

async function showNotice(el) {
	el = $.create(el);
	document.body.prepend(el);
	await defer(2000);
	return fadeRemove(el).then(arr => arr[0]);
}

async function fadeRemove(els) {
	els = Array.isArray(els)? els : [els];
	els = await Promise.all($.transition(els, {opacity: 0}, 400));
	return els.map(el => el.remove());
}

async function clear() {
	let els = await Promise.all($.transition($$("#word *, #photos *, #translation"), {opacity: 0}, 400));
	photos.textContent = word.textContent = translation.textContent = "";
	content.hidden = translation.hidden = true;
	els.forEach(el => el.style.opacity = "");
}

function isScript(script, text) {
	let regex = new RegExp(`\\p{Script_Extensions=${script}}+`, "u");
	return regex.test(text);
}

// Only GR to EN for now
async function translate(word) {
	let response = await fetch(`https://www.wordreference.com/gren/${encodeURIComponent(word)}`);
	let html = await response.text();
	let root = new DOMParser().parseFromString(html, "text/html");

	// Is translation in first or second column?
	let toWords = $$("tr:not(.langHeader) > td.ToWrd", root).map(td => td.textContent.trim());
	let fromWords = $$("tr:not(.langHeader) > td.FrWrd > strong", root).map(strong => strong.textContent.trim());
	let words = isScript("Greek", toWords[0])? fromWords : toWords;

	// Sometimes the first row doesn't contain the best translation
	return words[0]?.length > words[1]?.length? words[1] : words[0];
}

import getPhotos from "../common/get-photos.js";

async function showPhoto(word) {
	let json = await getPhotos(word);

	photos.textContent = "";

	let imgs = json.results.map(photo => $.create("img", {
		src: photo.urls.small,
		alt: photo.description,
		style: {
			"--color": photo.color
		},
		inside: photos
	}));

	let onloads = imgs.map(img => new Promise(r => img.addEventListener("load", r)));

	await Promise.all(onloads);
	let rows = getComputedStyle(photos).getPropertyValue("--rows");
	let offset = photos.scrollHeight - innerHeight;
	//console.log(offset, photos.scrollHeight, innerHeight);
	if (offset < 0) {
		while ((photos.scrollHeight < innerHeight - 10) && rows > 1) {
			photos.style.setProperty("--rows", --rows);
			console.log("--", rows);
		}
	}
	else {
		while ((photos.scrollHeight > innerHeight + 40) && rows < 5) {
			photos.style.setProperty("--rows", ++rows);
			console.log("++", rows);
		}
	}
}
