import Color from "https://colorjs.io/color.js";
import "https://blissfuljs.com/bliss.js";

const $ = Bliss;

let playing = true;

document.oncontextmenu =
document.onkeypress = evt => {
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

let lastKey = 0;

document.onkeydown = evt => {
	switch (evt.key) {
		case " ":
			return clear();
		case "Backspace":
		case "Escape":
			word.lastElementChild?.remove();
			return;
		case "Enter":

			showPhoto(word.textContent);
			return;
	}


	let isLetter = /^\p{Letter}$/ui.test(evt.key);
	let isNumber = /^\p{Number}$/ui.test(evt.key);

	if (isLetter || isNumber) {
		let timeElapsed = Date.now() - lastKey;

		let lastCharacter = word.lastElementChild?.textContent;

		if (lastCharacter === evt.key && timeElapsed < 500) {
			return;
		}

		lastKey = Date.now();

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

async function clear() {
	await Promise.all($.transition($.$("#word *", word), {opacity: 0}, 400))
	word.textContent = "";
}

async function translate(word) {
	// https://www.wordreference.com/gren/%CE%B3%CE%B1%CF%84%CE%B1
	let response = await fetch(`https://www.wordreference.com/gren/${encodeURIComponent(word)}`);
	let html = await response.text();
	let root = new DOMParser().parseFromString(html, "text/html");
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
