/// Emal – Acquire and process scientific data with ease
/// number.js – Parser of arbitrary precision numbers.
///
/// An Emal number is specified by a sign, an integer part (Number), a
/// floating part (Number) and eventually an exponent (Number) and
/// exponent sign.
/// Parsing is based on a state machine with states corresponding to
/// parts of the number.

import { StateMachine } from "./stateMachine.js";
import { isDigit, isSign, isComma } from "./matchers.js";

// Define a start state which defines a local variable and simply returns.
// This declared local variable is used to construct tokens generically, so 
// that parsing of the number and exponent uses the same states.
function start(charCode) {
	this.isExponent = false;
	return this.sign(charCode);
}

function sign(charCode) {
	if(!isSign(charCode)) {
		return this.startIntPart(charCode);
	}

	this.token({}, `${this.isExponent ? "eS" : "s"}ign`);
	this.eat(charCode);

	return startIntPart;
}

function startIntPart(charCode) {
	if(!isDigit(charCode)) {
		return this.nok(charCode);
	}

	this.token({}, `${this.isExponent ? "eI" : "i"}ntPart`);
	this.eat(charCode);

	return intPart;
}

function intPart(charCode) {
	if(charCode === 69 || charCode === 101) {
		this.isExponent = true;
		return sign;
	// Exponents cannot have a floating part
	} else if(isComma(charCode) && !this.isExponent) {
		this.token({}, "floatPart");
		return floatPart;
	} else if(isDigit(charCode)) {
		this.eat(charCode);
		return intPart;
	}

	return this.end(charCode);
}

function floatPart(charCode) {
	if(charCode === 69 || charCode === 101) {
		this.isExponent = true;
		return sign;
	} else if(isDigit(charCode)) {
		this.eat(charCode);
		return floatPart;
	}

	return this.end(charCode);
}

// Used as a transformer on token values which are strings
function toNumber(token) {
	return Number(token.value);
}

function toValue(token) {
	return token.value;
}

const numberSm = new StateMachine("start",
	{
		start,
		sign,
		startIntPart,
		intPart,
		floatPart,
	},
	{
		transformers: {
			sign: toValue,
			intPart: toNumber,
			floatPart: toNumber,
			eSign: toValue,
			eIntPart: toNumber,
		},
		type: "parallel",
	},
);

export class EmalNumber {
	constructor(numberStr) {
		// Use defaults because some parts of the number are optional
		const defaultTokens = {
			sign: { value: "+" },
			floatPart: { value: 0 },
			eSign: { value: "+" },
			eIntPart: { value: 0 },
		};

		const runnerOutput = numberSm.run(numberStr, defaultTokens).transform();
		this.tokens = runnerOutput.tokens;
	}

	toString() {
		const t = this.tokens;

		let stringified = `${t.sign === "-" ? "-" : ''}${t.intPart},${t.floatPart}`;

		if(t.eIntPart !== 0) {
			stringified += `e${t.eSign === "-" ? "-" : ''}${t.eIntPart}`;
		}

		return stringified;
	}
}
