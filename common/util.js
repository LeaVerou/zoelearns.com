/**
 * Prints out a number with a singular or plural noun or a message for no items
 * @param {number} num
 * @param {object} options
 * @param {string} options.one - The singular noun
 * @param {string} [options.many] - The plural noun. Defaults to one + "s"
 * @param {string} [options.none] - The message for no items. Defaults to "No " + many
 * @returns
 */
export function amount (num, {one, many = one + "s", none = "No " + many} = {}) {
	if (num === 0) {
		return none;
	}

	return num + " " + (num == 1 ? one : many);
}

export function log (n, base = Math.E) {
	return Math.log(n) / Math.log(base);
}

export function round (n, decimals = 0) {
	return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

export function ceil (n, decimals = 0) {
	return Math.ceil(n * 10 ** decimals) / 10 ** decimals;
}
