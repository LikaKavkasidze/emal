import { Expression } from "./expression.js";
import { EmalNumber } from "./number.js";

class MockNumber {
	constructor(inner) {
		this.inner = inner;
	}

	static add(a, b) {
		return new MockNumber(a.inner + b.inner);
	}

	static sub(a, b) {
		return new MockNumber(a.inner - b.inner);
	}

	static mul(a, b) {
		return new MockNumber(a.inner * b.inner);
	}

	static div(a, b) {
		return new MockNumber(a.inner / b.inner);
	}

	static log10(a) {
		return new MockNumber(Math.log10(a.inner));
	}

	static max(a, b) {
		if(a.inner >= b.inner) {
			return new MockNumber(a.inner);
		} else {
			return new MockNumber(b.inner);
		}
	}
}

test("tokenizes simple expression", () => {
	const expr = new Expression("a + b");
	expect(expr.tokens).toMatchSnapshot();
});

test("tokenizes function", () => {
	const expr = new Expression("log(cH3O)");
	expect(expr.tokens).toMatchSnapshot();
});

test("executes simple expression", () => {
	const expr = new Expression("a + b");

	const a = new MockNumber(4.55);
	const b = new MockNumber(1.22);

	expect(expr.evaluate({ a, b }).inner).toEqual(5.77);
});

test("executes function", () => {
	const expr = new Expression("log(cH3O)");
	const cH3O = new MockNumber(1.22);

	expect(expr.evaluate({ cH3O }).inner).toEqual(Math.log10(1.22));
});

test("executes function with multiple arguments", () => {
	const expr = new Expression("max(a; b)");

	const a = new MockNumber(4.55);
	const b = new MockNumber(1.22);

	expect(expr.evaluate({ a, b }).inner).toEqual(4.55);
});

test("tokenizes in RPN", () => {
	const expr = new Expression("a + b * a + (a - b)");
	expect(expr.tokens).toMatchSnapshot();
});

test("delegates number parsing", () => {
	const expr = new Expression("a * -2.5e-2");
	expect(expr.tokens).toMatchSnapshot();
});

test("supports Emal numbers", () => {
	const a = EmalNumber.fromString("1.52");
	const b = EmalNumber.fromString("5e-1");

	const expr = new Expression("(a + b) / 2");
	const res = expr.evaluate({ a, b });

	expect(res.toString()).toEqual("1,01");
});

test("distinguishes number comma and argument separator", () => {
	const expr = new Expression("2,5 * max(a, b)");
	expect(expr.tokens).toMatchSnapshot();
});
