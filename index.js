import Color from "https://colorjs.io/color.js";
import "https://blissfuljs.com/bliss.js";

const $ = Bliss;
const defer = delay => new Promise(resolve => delay === undefined? requestAnimationFrame(resolve) : setTimeout(resolve, delay));

let playing = true;

document.oncontextmenu =
document.onkeyup =
document.onclick =
evt => {
	if (playing) {
		evt.preventDefault();
		buffer.focus;
	}
};

document.addEventListener("keyup", evt => {
	if (evt.key === "1" && (evt.ctrlKey || evt.metaKey) && evt.shiftKey) {
		playing = !playing;
		document.documentElement.classList.toggle("playing", playing);

		showNotice({
			textContent: playing? "Playing" : "Paused",
			className: "play-notice " + (!playing? "not-" : "") + "-playing"
		});
	}
});

let isLetter = text => /^\p{Letter}$/ui.test(text);
let isNumber = text => /^\p{Number}$/ui.test(text);

buffer.oninput = evt => {
	let {target} = evt;
	let text = target.value;
	let hue, color, classes, style;

	if (isLetter(text)) {
		let code = text.charCodeAt(0)
		hue = (code - 65) * 12;
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
		let colorStr = color.toString({fallback: true});

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
			evt.preventDefault();
			return;
		case "Tab":
			buffer.focus();
			evt.preventDefault();
			return;
		case "Enter":
			let text = word.textContent.trim();

			if (isScript("Greek", text)) {
				text = await translate(text);
				translation.textContent = text;
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
	await fadeRemove($.$("#word *, #photos *"));
	photos.textContent = word.textContent = "";
	content.hidden = true;
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
	let toWord = root?.querySelector("tr:not(.langHeader) > td.ToWrd")?.textContent.trim();
	let fromWord = root?.querySelector("tr:not(.langHeader) > td.FrWrd > strong")?.textContent.trim();

	if (isScript("Greek", toWord)) {
		return fromWord;
	}

	return toWord;
}

async function showPhoto(word) {
	let url = new URL("https://api.unsplash.com/search/photos/");
	url.searchParams.set("query", word);
	let response = await fetch(url, {
		headers: {
			Authorization: "Client-ID Sxsv-UZ99YLiDi84bRufynBYxDxGVCPb4Os1nI6uZ-c"
		}
	});
	let json = await response.json();

	photos.textContent = "";

	for (let photo of json.results) {
		$.create("img", {
			src: photo.urls.small,
			alt: photo.description,
			style: {
				"--color": photo.color
			},
			inside: photos
		})
	}
}
