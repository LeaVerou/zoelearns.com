import getPhotos from "../util/get-photos.js";

const vowels = "αεηιουω";
const consonants = "βγδζθκλμνξπρσςτφχψ";
const word_info = await (await fetch("words.json")).json();
const words = Object.keys(word_info);

let methods = {
	dropAccents (word) {
		return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	},

	syllabize(word) {
		let syllables = [];
		let syllable = "";

		// Drop accents
		let normalizedWord = methods.dropAccents(word);

		for (let i = 0; i < normalizedWord.length; i++) {
			let letter = normalizedWord[i];
			let originalLetter = word[i];
			syllable += originalLetter;

			if (vowels.includes(letter)) {
				syllables.push(syllable);
				syllable = "";
			}
		}

		if (syllable.length > 0) {
			syllables.push(syllable);
		}

		return syllables;
	},

	gotoSyllable(offset) {
		let word = document.querySelector(".word");
		let activeSyllable = word.querySelector(".syllable.active");

		if (activeSyllable) {
			activeSyllable.classList.remove("active");

			// Make next syllable active
			let nextSyllable = activeSyllable[offset < 0? "previousElementSibling" : "nextElementSibling"];
			if (nextSyllable) {
				nextSyllable.classList.add("active");
			}
		}
		else {
			// Make first syllable active
			let firstSyllable = word.querySelector(".syllable");
			firstSyllable.classList.add("active");
		}
	},

	gotoWord(offset) {
		let currentIndex = parseInt(document.body.dataset.word);
		let newIndex = currentIndex + offset;

		// Roll index around
		if (newIndex < 0) {
			newIndex = words.length + newIndex;
		}
		else if (newIndex >= words.length) {
			newIndex = newIndex - words.length;
		}

		document.body.dataset.word = newIndex;
		readWord(newIndex);
	},

	async correct() {
		// Remove active syllable, if present
		document.querySelector(".syllable.active")?.classList.remove("active");

		let word = document.querySelector(".word").textContent;
		let info = word_info[word];

		if (!info) {
			throw new Error(`No info for word ${word}`);
		}

		let json = await getPhotos(info.en, {per_page: 4});
		let totalAspectRatio = 0;
		let photos = json.results.map(photo => {
			totalAspectRatio += photo.width / photo.height;
			return Object.assign(document.createElement("img"), {
				src: photo.urls.small,
				alt: photo.description,
				className: "photo",
				style: Object.entries({
					"--color": photo.color,
					"--width": photo.width,
					"--height": photo.height
				}).map(([key, value]) => `${key}: ${value}`).join("; ")
			});
		});

		document.querySelector(".photos").style.setProperty("--total-aspect-ratio", totalAspectRatio);

		document.querySelector(".photos").append(...photos);
	},

	wrong() {

	}
}

// Shortcuts
Object.assign(methods, {
	nextSyllable: methods.gotoSyllable.bind(null, 1),
	previousSyllable: methods.gotoSyllable.bind(null, -1),
	nextWord: methods.gotoWord.bind(null, 1),
	previousWord: methods.gotoWord.bind(null, -1),
});


function readWord(wordOrIndex) {
	let word = wordOrIndex;
	if (typeof wordOrIndex === "number") {
		document.body.dataset.word = wordOrIndex;
		word = words[wordOrIndex];
	}

	let syllables = methods.syllabize(word);
	let formattedSyllables = syllables.map(syllable => {
		let formattedSyllable = [...syllable].map(letter => {
			let normalizedLetter = methods.dropAccents(letter);
			let index = normalizedLetter.charCodeAt(0) - "α".charCodeAt(0);
			return `<span class="letter" style="--index: ${index}">${letter}</span>`
		}).join("");
		return `<span class="syllable">${formattedSyllable}</span>`;
	});

	let article = document.createElement("article");
	article.classList.add("word-card");
	article.innerHTML = `
		<div class="toolbar">
			<button class="previous-word">◀◀</button>
			<button class="previous">◀</button>
			<div class="spacer"></div>
			<button class="correct">✓</button>
			<button class="wrong">✗</button>
			<div class="spacer"></div>
			<button class="next">▶</button>
			<button class="next-word">▶▶</button>
		</div>
		<h2 class="word">${ formattedSyllables.join("") }</h2>
		<div class="photos"></div>
	`;

	document.addEventListener("keydown", evt => {
		if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
			if (evt.shiftKey) {
				methods.previousWord();
			}
			else {
				methods.previousSyllable();
			}
		}
		else if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
			if (evt.shiftKey) {
				methods.nextWord();
			}
			else {
				methods.nextSyllable();
			}
		}
		else if (evt.key === "Enter") {
			methods.correct();
		}
	});

	let buttons = {
		previous: article.querySelector(".previous"),
		next: article.querySelector(".next"),
		previousWord: article.querySelector(".previous-word"),
		nextWord: article.querySelector(".next-word"),
		correct: article.querySelector(".correct"),
		wrong: article.querySelector(".wrong")
	}

	for (let button in buttons) {
		buttons[button].addEventListener("click", methods[button]);
	}

	document.body.append(article);
}


readWord(3);