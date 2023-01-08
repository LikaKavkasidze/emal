/// Emal – Acquire and process scientific data with ease
/// matchers.js – Utilities to categorize characters.

const DIGITS = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
const WHITESPACES = [9, 10, 13, 32];

// 43 = "+" | 45 = "-"
export function isSign(charCode) {
	return charCode === 43 || charCode === 45;
};

// 44 = "," | 46 = "."
export function isComma(charCode) {
	return charCode === 44 || charCode === 46;
};

// 40 = "(" | 91 = "["
export function isOpeningBracket(charCode) {
	return charCode === 40 || charCode === 91;
};

// 41 = ")" | 93 = "]"
export function isClosingBracket(charCode) {
	return charCode === 41 || charCode === 93;
};

export function isDigit(charCode) {
	return DIGITS.includes(charCode);
};

export function isWhitespace(charCode) {
	return WHITESPACES.includes(charCode);
};
