/// Emal – Acquire and process scientific data with ease
/// number.js – Parser of arbitrary precision numbers.
///
/// An Emal number is stored as a large integer (BigInt) with decimal
/// place position.
/// Parsing is based on a state machine with states corresponding to
/// parts of the number.

import { StateMachine } from "./stateMachine.js";
import { isDigit, isSign, isComma } from "./matchers.js";

// Default decimal count for `toString`
const ENUMBER_DEFAULT_DC = 2;
// Default extra decimals computed for division
const ENUMBER_DEFAULT_DIV_OFFSET = BigInt(ENUMBER_DEFAULT_DC + 2);

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
	return BigInt(token.value);
}

function toValue(token) {
	return token.value;
}

export const numberSm = new StateMachine("start",
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
			intPart: toValue,
			floatPart: toValue,
			eSign: toValue,
			eIntPart: toNumber,
		},
		type: "parallel",
	},
);

function BIPow(n, p) {
	let o = n;

	for(; p > 1; p--) {
		o *= n;
	}

	return o;
}

function preprocessOp(a, b) {
	let aInt = a.rawInt;
	let bInt = b.rawInt;

	let aLen = a.decimalPlace;
	let bLen = b.decimalPlace;

	if(aLen > bLen) {
		const delta = aLen - bLen;
		bInt *= BIPow(10n, delta);
		bLen += delta;
	} else if(bLen > aLen) {
		const delta = bLen - aLen;
		aInt *= BIPow(10n, delta);
		aLen += delta;
	}

	return {
		aInt,
		bInt,
		oLen: aLen,
	};
}

export class EmalNumber {
	constructor(rawInt, decimalPlace) {
		this.rawInt = rawInt;
		this.decimalPlace = decimalPlace;
	}

	static fromTokens(userTokens) {
		// Use defaults because some parts of the number are optional
		const defaultTokens = {
			sign: "+",
			floatPart: "0",
			eSign: "+",
			eIntPart: "0",
		};

		const tokens = Object.assign({}, defaultTokens, userTokens);

		const rawInt = BigInt(`${tokens.sign}${tokens.intPart}${tokens.floatPart}`);
		const exponent = BigInt(`${tokens.eSign}${tokens.eIntPart}`);
		const decimalPlace = BigInt(tokens.floatPart.length) - exponent;

		return new EmalNumber(rawInt, decimalPlace);
	}

	static fromString(numberStr) {
		const runnerOutput = numberSm.run(numberStr).transform();
		return EmalNumber.fromTokens(runnerOutput.tokens);
	}

	toString(decimalCount) {
		// Dynamic default argument
		if(typeof decimalCount !== "number") decimalCount = ENUMBER_DEFAULT_DC;

		const { rawInt, decimalPlace } = this;

		const intStr = rawInt.toString(10);
		const exponent = BigInt(intStr.length) - decimalPlace - 1n;

		const intPart = intStr.substr(0, 1);
		const floatPart = intStr.substr(1, decimalCount);

		return `${intPart},${floatPart}${exponent !== 0n ? "e".concat(exponent) : ""}`
	}

	static add(a, b) {
		const { aInt, bInt, oLen } = preprocessOp(a, b);
		return new EmalNumber(aInt + bInt, oLen);
	}

	static sub(a, b) {
		const { aInt, bInt, oLen } = preprocessOp(a, b);
		return new EmalNumber(aInt - bInt, oLen);
	}

	static mul(a, b) {
		const { aInt, bInt, oLen } = preprocessOp(a, b);
		return new EmalNumber(aInt * bInt, oLen * 2n);
	}

	static div(a, b) {
		const { aInt, bInt, oLen } = preprocessOp(a, b);
		// Dividing arbitrary precision numbers cannot be done
		// with infinite precision, here the number is cut to
		// ENUMBER_DEFAULT_DIV_OFFSET digits after decimal point.
		const offset = ENUMBER_DEFAULT_DIV_OFFSET + oLen;
		return new EmalNumber(aInt * BIPow(10n, offset) / bInt, offset);
	}
}
