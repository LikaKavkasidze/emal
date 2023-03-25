/// Emal – Acquire and process scientific data with ease
/// number.js – Parser of arbitrary precision numbers.
///
/// Copyright (C) 2023 Titouan (Stalone) S.
/// This program is free software: you can redistribute it and/or modify it
/// under the terms of the GNU Affero General Public License as published by
/// the Free Software Foundation, version 3.
///
/// An Emal number is stored as a large integer (BigInt) with decimal
/// place position.
/// Parsing is based on a state machine with states corresponding to
/// parts of the number.

import { StateMachine } from "./stateMachine.js";
import { isDigit, isSign, isDecimalPoint } from "./matchers.js";

// Default decimal count for `toString`
const ENUMBER_DEFAULT_DC = 2;
// Default extra decimals computed for division
const ENUMBER_DEFAULT_DIV_OFFSET = ENUMBER_DEFAULT_DC;

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
	} else if(isDecimalPoint(charCode) && !this.isExponent) {
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

function preprocessOp(a, b) {
	let aInt = a.rawInt;
	let bInt = b.rawInt;

	let aLen = a.decimalPlace;
	let bLen = b.decimalPlace;

	if(aLen > bLen) {
		const delta = aLen - bLen;
		bInt *= 10n ** delta;
		bLen += delta;
	} else if(bLen > aLen) {
		const delta = bLen - aLen;
		aInt *= 10n ** delta;
		aLen += delta;
	}

	return {
		aInt,
		bInt,
		oLen: aLen,
	};
}

function logRestrictTest(x) {
	const firstChar = x.rawInt.toString(10).charAt(0);

	if(["7", "8", "9"].includes(firstChar)) return true;
	else if(firstChar === "1") {
		const secondChar = x.rawInt.toString(10).charAt(1);

		if(["0", "1", "2", "3"].includes(secondChar)) return true;
	}

	return false;
}

export class EmalNumber {
	static INV_LN10 = new EmalNumber(43429448190325182765n, 20n);

	constructor(rawInt, decimalPlace) {
		this.rawInt = rawInt;
		this.decimalPlace = decimalPlace;
		this.isNegative = rawInt < 0;
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

	static fromInt(n) {
		return new EmalNumber(BigInt(n), 0n);
	}

	rawLength() {
		let rawLength = BigInt(this.rawInt.toString(10).length);
		if(this.isNegative) rawLength--;

		return rawLength;
	}

	toString(decimalCount) {
		// Dynamic default argument
		if(typeof decimalCount !== "number") decimalCount = ENUMBER_DEFAULT_DC;
		// Compute one extra decimal for rounding and one for the
		// integer part (before comma).
		const neededLen = BigInt(decimalCount + 2);
		let intLen = this.rawLength();

		// Add trailing zeroes if necessary
		if(neededLen > intLen) {
			const delta = neededLen - intLen;

			this.rawInt *= 10n ** delta;
			this.decimalPlace += delta;
			intLen += delta;
		}

		let { rawInt, decimalPlace, isNegative } = this;
		// Add 5 to the digit following the cut to avoid truncation
		if(isNegative) rawInt -= 5n * 10n ** BigInt(intLen - neededLen);
		else rawInt += 5n * 10n ** BigInt(intLen - neededLen);

		const exponent = BigInt(intLen) - decimalPlace - 1n;
		let intStr = rawInt.toString(10);

		const intPart = isNegative ? intStr.substr(0, 2) : intStr.substr(0, 1);
		const floatPart = isNegative ? intStr.substr(2, decimalCount) : intStr.substr(1, decimalCount);

		return `${intPart},${floatPart}${exponent !== 0n ? "e".concat(exponent) : ""}`
	}

	clone() {
		return new EmalNumber(this.rawInt, this.decimalPlace);
	}

	// Simplify a number without loosing precision by removing trailing zeroes
	simplify() {
		const intStr = this.rawInt.toString(10);

		for(let i = intStr.length - 1; intStr.charAt(i) === '0'; i--) {
			this.rawInt /= 10n;
			this.decimalPlace--;
		}

		return this;
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
		const offset = BigInt(ENUMBER_DEFAULT_DIV_OFFSET) + oLen;
		return new EmalNumber(aInt * 10n ** offset / bInt, offset);
	}

	static log10(initialX) {
		// Argument reduction: returns a number starting with 7, 8, 9, 10, 11,
		// 12 or 13.
		let x = initialX.clone();
		let preprocessPow = 1n;
	
		while(!logRestrictTest(x)) {
			x = EmalNumber.mul(x, initialX);
			preprocessPow++;
		}

		// Argument reduction: divide the number by 10^m to get it in the
		// range [0.7; 1.3].
		let preprocessPowTen = x.rawLength() - x.decimalPlace - (x.rawInt.toString(10).charAt(0) === "1" ? 1n : 0n);
		x.decimalPlace += preprocessPowTen;

		// Use power series for log(1 + x) near x = 0
		const delta = EmalNumber.sub(x, EmalNumber.fromInt(1));
	
		let deltaPow = delta.clone();
		let result = EmalNumber.fromInt(0);
	
		for(let i = 1; i < 10; i++) {
			const divisor = (i % 2 === 0 ? -1 : 1) * i;
			const prefactor = EmalNumber.div(EmalNumber.INV_LN10, EmalNumber.fromInt(divisor));
	
			result = EmalNumber.add(result, EmalNumber.mul(prefactor, deltaPow));
			deltaPow = EmalNumber.mul(deltaPow, delta);
		}
	
		// Reverse argument reduction using log(x * 10^m) = log(x) - m
		// and log(x^n) = n log x.
		const powTenCorrected = EmalNumber.add(result, EmalNumber.fromInt(preprocessPowTen));
		const powCorrected = EmalNumber.div(powTenCorrected, EmalNumber.fromInt(preprocessPow));
	
		return powCorrected.simplify();
	}
}
