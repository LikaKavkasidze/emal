/// Emal – Acquire and process scientific data with ease
/// uncertainty.js – Abstract data structure for scientific values.
///
/// A full value is made both of a raw value, and of the uncertainty
/// (or error) associated with the value.
/// Computing done on the value needs to account for both of these
/// numbers.

import { EmalNumber } from "./number.js";

export class UncertainValue {
	constructor(value, absU) {
		this.value = value;
		this.absU = absU;
	}

	static fromString(valueStr, absUStr) {
		const value = EmalNumber.fromString(valueStr);
		const absU = EmalNumber.fromString(absUStr);

		return new UncertainValue(value, absU);
	}

	static add(a, b) {
		// Delegate to Number
		const value = EmalNumber.add(a.value, b.value);
		const absU = EmalNumber.add(a.absU, b.absU);

		return new UncertainValue(value, absU);
	}

	static sub(a, b) {
		// Delegate to Number
		const value = EmalNumber.sub(a.value, b.value);
		const absU = EmalNumber.sub(a.absU, b.absU);

		return new UncertainValue(value, absU);
	}

	// Important note: propagation of uncertainties on multiplication
	// and division is done by differential method - that is to say,
	// by adding relative uncertainties, in accordance to all other
	// propagations done in Emal.
	static mul(a, b) {
		const aRelU = EmalNumber.div(a.absU, a.value);
		const bRelU = EmalNumber.div(b.absU, b.value);
		const cRelU = EmalNumber.add(aRelU, bRelU);

		const value = EmalNumber.mul(a.value, b.value);
		const cAbsU = EmalNumber.mul(cRelU, value);

		return new UncertainValue(value, cAbsU);
	}

	static div(a, b) {
		const aRelU = EmalNumber.div(a.absU, a.value);
		const bRelU = EmalNumber.div(b.absU, b.value);
		const cRelU = EmalNumber.add(aRelU, bRelU);

		const value = EmalNumber.div(a.value, b.value);
		const cAbsU = EmalNumber.mul(cRelU, value);

		return new UncertainValue(value, cAbsU);
	}
}
