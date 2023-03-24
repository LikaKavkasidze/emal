import { EmalNumber } from "./number.js";

test("tokenizes numbers", () => {
	const simple = EmalNumber.fromString("9.44");
	const scientific = EmalNumber.fromString("4.56e-6");
	const negative = EmalNumber.fromString("-4.5e-3");

	expect(simple).toMatchSnapshot();
	expect(scientific).toMatchSnapshot();
	expect(negative).toMatchSnapshot();
});

test("allows commas", () => {
	const n = EmalNumber.fromString("520,73");
	expect(n).toMatchSnapshot();
});

test("finds length", () => {
	const simple = EmalNumber.fromString("9.44");
	const scientific = EmalNumber.fromString("4.56e-6");
	const negative = EmalNumber.fromString("-4.5e-3");

	expect(simple.rawLength()).toEqual(3n);
	expect(scientific.rawLength()).toEqual(3n);
	expect(negative.rawLength()).toEqual(2n);
});

test("serializes numbers", () => {
	const simpleStr = "9.44";
	const scientificStr = "4.56e-6";
	const negativeStr = "-4.5e-3";

	const simple = EmalNumber.fromString(simpleStr);
	const scientific = EmalNumber.fromString(scientificStr);
	const negative = EmalNumber.fromString(negativeStr);

	expect(simple.toString()).toEqual(simpleStr.replace(".", ","));
	expect(scientific.toString()).toEqual(scientificStr.replace(".", ","));
	expect(negative.toString(1)).toEqual(negativeStr.replace(".", ","));
});

test("rounds correctly", () => {
	const str = "8,5888";
	const n = EmalNumber.fromString(str);
	expect(n.toString()).toEqual("8,59");
});

test("adds numbers", () => {
	const a = EmalNumber.fromString("4.56e-2");
	const b = EmalNumber.fromString("1,07");

	expect(EmalNumber.add(a, b).toString(4)).toEqual("1,1156");
});

test("divides numbers", () => {
	const a = EmalNumber.fromString("4.56e-2");
	const b = EmalNumber.fromString("1,07");

	expect(EmalNumber.div(a, b).toString()).toEqual("4,26e-2");
});

test("log numbers", () => {
	const x = new EmalNumber(23n, 1n);
	const y = new EmalNumber(87n, 2n);

	expect(EmalNumber.log10(x).toString()).toEqual("3,62e-1");
	expect(EmalNumber.log10(y).toString()).toEqual("-6,05e-2");
});
