/// Emal – Acquire and process scientific data with ease
/// matchers.js – Utilities to categorize characters.

const DIGITS = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];

// 43 = "+" | 45 = "-"
export function isSign(charCode) {
	return charCode === 43 || charCode === 45;
};

// 44 = "," | 46 = "."
export function isDecimalPoint(charCode) {
	return charCode === 44 || charCode === 46;
};

// 44 = "," | 59 = ";"
export function isCommaSeparator(charCode) {
	return charCode === 44 || charCode === 59;
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

// 9 = "<Tab>" | 32 = " "
export function isWhitespace(charCode) {
	return charCode === 9 || charCode === 32;
};

// 10 = "<LF>" | 13 = "<CR>"
export function isNewline(charCode) {
	return charCode === 10 || charCode === 13;
};
