/// Emal – Acquire and process scientific data with ease
/// matchers.js – Utilities to categorize characters.

const DIGITS = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];

export function isSign(charCode) {
	return charCode === 43 || charCode === 45;
};

export function isComma(charCode) {
	return charCode === 44 || charCode === 46;
};

export function isDigit(charCode) {
	return DIGITS.includes(charCode);
};
