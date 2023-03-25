/// Emal – Acquire and process scientific data with ease
/// unit.js – Parser and processor of scientific units.
///
/// Copyright (C) 2023 Titouan (Stalone) S.
/// This program is free software: you can redistribute it and/or modify it
/// under the terms of the GNU Affero General Public License as published by
/// the Free Software Foundation, version 3.
///
/// An unit is made of three components: an user given name, which should 
/// always be used if given, a generated identifier used for computing units
/// in calculations, and a multiplier, which would be a prefix in a more
/// user-friendly notation.

import { Expression } from "./expression.js";

// SI prefixes stored in such a way that they can be multiplied and
// devided together; only the first prefixes are used.
const PREFIXES = {
	"p": 1e-12,
	"n": 1e-9,
	"µ": 1e-6,
	"m": 1e-3,
	"c": 1e-2,
	"d": 1e-1,
	"h": 1e2,
	"k": 1e3,
	"M": 1e6,
	"G": 1e9,
	"T": 1e12,
};

// Base SI units are stored using prime numbers. These primes
// are multiplied to give derived units. Some units at the end
// are not base SI units, but still cannot be integrated as
// derived units by now.
const BASE_UNITS = {
	"kg": 2,
	"s": 3,
	"m": 5,
	"K": 7,
	"A": 11,
	"mol": 13,
	"cd": 17,
	// These units are NOT base SI units
	"L": 19,
	"°C": 23,
	"g": 27,
};

// Derived SI units use an identifier in the form of a numerator
// and a denominator (like a fraction). This way, base units being
// prime numbers, each unit has an unique identifier.
const DERIVED_UNITS = {
	"rad": { num: 1, den: 1 }, // m/m
	"sr": { num: 1, den: 1 }, // m^2/m^2
	"Hz": { num: 1, den:BASE_UNITS.s },
	"N": { num: BASE_UNITS.kg * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s },
	"Pa": { num: BASE_UNITS.kg, den: BASE_UNITS.m * BASE_UNITS.s * BASE_UNITS.s },
	"J": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den:BASE_UNITS.s * BASE_UNITS.s },
	"W": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s },
	"C": { num: BASE_UNITS.s * BASE_UNITS.A, den: 1 },
	"V": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A },
	"F": { num: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A * BASE_UNITS.A, den: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m },
	"Ω": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A * BASE_UNITS.A },
	"S": { num: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A * BASE_UNITS.A, den: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m },
	"Wb": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A },
	"T": { num: BASE_UNITS.kg, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A },
	"H": { num: BASE_UNITS.kg * BASE_UNITS.m * BASE_UNITS.m, den: BASE_UNITS.s * BASE_UNITS.s * BASE_UNITS.A * BASE_UNITS.A },
	"lm": { num: BASE_UNITS.cd, den: 1 }, // cd*sr
	"lx": { num: BASE_UNITS.cd, den: BASE_UNITS.m * BASE_UNITS.m }, // cd*sr/m^2
};

// Recursively compute the Greatest Common Divider between
// two numbers.
function findGcd(a, b) {
	return b ? findGcd(b, a % b) : a;
}

// Search name of an unit fragment with the following priority:
// first, search for a base unit, then for a derived unit and
// finally for an unit with prefix.
function interpretFragment(unitString, multiplier = 1) {
	if(unitString in BASE_UNITS) {
		return new Unit(BASE_UNITS[unitString], 1, multiplier);
	}

	if(unitString in DERIVED_UNITS) {
		return new Unit(DERIVED_UNITS[unitString].num, DERIVED_UNITS[unitString].den, multiplier);
	}

	// Search for a prefix and go back
	const potentialPrefix = unitString.charAt(0);

	if(potentialPrefix in PREFIXES) {
		const potentialMultiplier = PREFIXES[potentialPrefix];
		return interpretFragment(unitString.substring(1), potentialMultiplier);
	}
}

export class Unit {
	// Constructs an unit from raw identifiers for numerator and denominator
	// and from a multiplier.
	constructor(num, den, multiplier) {
		this.userName = "";
		this.id = { num, den };
		this.multiplier = multiplier;
	}

	static fromString(unitStr) {
		const expr = new Expression(unitStr);
		const usedUnits = expr.tokens.reduce((acc, tok) => {
			if(tok.type === "variable") acc[tok.value] = interpretFragment(tok.value);
			return acc;
		}, {});

		const result = expr.evaluate(usedUnits);
		result.userName = unitStr;

		return result;
	}

	// Reduce the unit id: because base units are prime numbers,
	// simplifying an unit uses an algorithm similar to reducing
	// a fraction.
	reduceId() {
		const gcd = findGcd(this.id.num, this.id.den);

		this.id = {
			num: this.id.num / gcd,
			den: this.id.den / gcd,
		};
	}

	// A canonical unit name is either a derived unit with matching
	// identifier or a fully simplified unit name, composed of base
	// units.
	toString() {
		if(this.userName) return this.userName;

		this.reduceId();

		let currentUnit = "";

		// Do not search if unity
		if(this.id.num === 1 && this.id.den === 1) {
			currentUnit = "1";
		}

		// Search for a derived unit that would match
		if(currentUnit === "") {
			currentUnit = Object.entries(DERIVED_UNITS)
				.reduce((acc, [k, v]) => {
					if(this.id.num === v.num && this.id.den === v.den) {
						acc = k;
					}

					return acc;
				}, "");
		}

		// Otherwise, compose base units
		if(currentUnit === "") {
			let {num, den} = this.id;
			let numStr = "";
			let denStr = "";
			let denCount = 0;

			// Algorithm for decomposition into prime numbers.
			// Fortunately, only a few primes can be used here,
			// so it does not take too long.
			while((num !== 1 || den !== 1) && !isNaN(num) && !isNaN(den)) {
				Object.entries(BASE_UNITS).forEach(([unit, id]) => {
					if(num % id === 0) {
						num /= id;
						numStr += `·${unit}`;
					}

					if(den % id === 0) {
						den /= id;
						denCount++;
						denStr += `·${unit}`;
					}
				});
			}

			if(denCount === 0) {
				currentUnit = numStr.substring(1);
			} else if(denCount === 1) {
				currentUnit = `${numStr.substring(1)}/${denStr.substring(1)}`;
			} else {
				currentUnit = `${numStr.substring(1)}/(${denStr.substring(1)})`;
			}
		}

		// Add prefix to the unit
		if(this.multiplier !== 1) {
			let potentialPrefix = Object.entries(PREFIXES)
				.filter(([_, v]) => v === this.multiplier)
				.map(([k, _]) => k)[0];

			if(typeof potentialPrefix === "undefined") potentialPrefix = "?";
			
			currentUnit = potentialPrefix + currentUnit;
		}

		return currentUnit;
	}

	// Expect consistent units: the result is the unit of a and b
	static add(a, b) {
		return new Unit(a.id.num, a.id.den, a.multiplier);
	}

	static sub(a, b) {
		return new Unit(a.id.num, a.id.den, a.multiplier);
	}

	static mul(a, b) {
		const num = a.id.num * b.id.num;
		const den = a.id.den * b.id.den;
		const multiplier = a.multiplier * b.multiplier;

		return new Unit(num, den, multiplier);
	}

	static div(a, b) {
		const num = a.id.num * b.id.den;
		const den = a.id.den * b.id.num;
		const multiplier = a.multiplier / b.multiplier;

		return new Unit(num, den, multiplier);
	}

	static log10(a) {
		// TODO: handle case where multiplier is not unitary
		return new Unit(1, 1, 1);
	}
}
