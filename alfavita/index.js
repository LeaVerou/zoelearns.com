const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

let all_letters_audio = new Audio("letters.m4a");

if (all_letters_audio.readyState < 4) {
	await Promise.race([
		new Promise(r => all_letters_audio.addEventListener("canplaythrough", r, { once: true })),
		sleep(1000) // Timeout in case canplaythrough doesn't fire
	]);
}

document.documentElement.classList.remove("loading");

// Letters and start audio positions
let letters = {
	"α": 0.9,
	"β": 2,
	"γ": 3.4,
	"δ": 4.8,
	"ε": 6,
	"ζ": 7.25,
	"η": 8.7,
	"θ": 10.1,
	"ι": 11.4,
	"κ": 12.6,
	"λ": 13.9,
	"μ": 14.95,
	"ν": 16.5,
	"ξ": 18.3,
	"ο": 20.0,
	"π": 21.5,
	"ρ": 23,
	"σ": 24.2,
	"τ": 26.3,
	"υ": 28,
	"φ": 29.5,
	"χ": 30.9,
	"ψ": 32.2,
	"ω": 33.6
}

// Letter duration in ms
const LETTER_DURATION = 800;

// const audioContext = new AudioContext();
// let allLetters = audioContext.createMediaElementSource(all_letters);

// const mainAudioBuffer = audioContext.createBufferSource();
// allLetters.connect(mainAudioBuffer);

let letterPlaying;

// Create buttons
let i = 0;
for (let letter in letters) {
	let start = letters[letter];

	// const clipBuffer = audioContext.createBufferSource();
	// clipBuffer.buffer = mainAudioBuffer.buffer;
	// clipBuffer.connect(audioContext.destination);

	letters_section.insertAdjacentHTML("beforeend", `<button data-letter="${letter}" style="--index: ${ i++ }">
		<span class="upper">${ letter.toUpperCase() }</span>
		<span class="lower">${ letter }</span>
		<audio id="letter_${letter}_audio"></audio>
	</button>`);

	let button = letters_section.children[letters_section.children.length - 1]

	// let clipAudio = document.getElementById(`letter_${letter}_audio`);
	// clipBuffer.start(0, start);
	// clipBuffer.stop(0, end);

	// const clipStream = audioContext.createMediaStreamDestination();
	// clipBuffer.connect(clipStream);

	// clipAudio.srcObject = clipStream.stream;

	button.onclick = async e => {
		// If audio is already playing, wait for it to finish
		if (all_letters_audio.paused === false) {
			await new Promise(r => all_letters_audio.addEventListener("pause", r, { once: true }));
		}

		document.body.classList.remove("playing");
		await sleep(10);

		letterPlaying = letter;

		// Stop any playing audio
		// all_letters_audio.pause();

		// Set audio position to start of clip
		all_letters_audio.currentTime = start;

		// Play audio until end of clip

		let started = all_letters_audio.play();
		if (isSafari) {
			await sleep(500);
		}
		document.body.classList.add("playing");
		await started;
		await sleep(LETTER_DURATION);

		if (letterPlaying === letter) {
			document.body.classList.remove("playing");
			all_letters_audio.pause();
			letterPlaying = null;
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}