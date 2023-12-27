// import { dropAccents } from "../../util.js";

export const code = "en-GB";
export const READING_GRANULARITY = "phoneme";
export const VOWELS_NOACCENTS = "aeiou";

// ai,	ay,	ee,	ea,	ie, ei, oo,	ou,	ow,	oe,	oo,	ue,	ey,	ay,	oy,	oi,	au,	aw etc
export const DIGRAPH_VOWELS = ["ai", "ay", "aw", "au", "ee", "oo", "ea", "ee", "ei", "ey", "ie", "oa", "oe", "oi", "oo", "ou", "oy", "ue", "ui", "uy"];
// sh,	ch,	th,	wh,	ck,	ph,	ng etc
export const DIGRAPH_CONSONANTS = ["ch", "ck", "gh", "gn", "kn", "ng", "ph", "qu", "rh", "sc", "sh", "th", "wh", "wr"];