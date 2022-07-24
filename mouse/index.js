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

let i = 0;

async function newCircle(oldCircle) {
	score.innerHTML = `Score: <strong>${ i }</strong>`;

	document.body.insertAdjacentHTML("beforeend", `<div class="circle open"
	style="
		--color: ${ new Color("lch", [60, 80, Math.random() * 360]).display() };
		--x: ${ Math.random() * 100 }%;
		--y: ${ Math.random() * 100 }%;
		--i: ${ ++i };
	"></div>`);



	let circle = document.body.lastElementChild;
	circle.addEventListener("mouseenter", evt => {
		evt.target.classList.remove('open');
		newCircle();
	}, {once: true});

	circle.addEventListener("transitionend", evt => evt.target.remove());
}

newCircle();

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