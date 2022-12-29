import { EmalNumber } from "./number.js";

test("supports scientific numbers", () => {
	const n = new EmalNumber("4.56e-6");
	expect(n.tokens).toEqual({
		sign: "+",
		intPart: 4,
		floatPart: 56,
		eSign: "-",
		eIntPart: 6,
	});
});

test("supports simple numbers", () => {
	const n = new EmalNumber("9.44");
	expect(n.tokens).toEqual({
		sign: "+",
		intPart: 9,
		floatPart: 44,
		eSign: "+",
		eIntPart: 0,
	});
});

test("allows commas", () => {
	const n = new EmalNumber("520,73");
	expect(n.tokens).toEqual({
		sign: "+",
		intPart: 520,
		floatPart: 73,
		eSign: "+",
		eIntPart: 0,
	});
});

test("serializes scientific numbers", () => {
	const str = "85,39e-3";
	const n = new EmalNumber(str);
	expect(n.toString()).toEqual(str);
});

test("serializes simple numbers", () => {
	const str = "85.39";
	const n = new EmalNumber(str);
	expect(n.toString()).toEqual(str.replace(".", ","));
});
