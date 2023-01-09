import { EmalNumber } from "./number.js";

test("supports scientific numbers", () => {
	const n = EmalNumber.fromString("4.56e-6");
	expect(n).toMatchSnapshot();
});

test("supports simple numbers", () => {
	const n = EmalNumber.fromString("9.44");
	expect(n).toMatchSnapshot();
});

test("allows commas", () => {
	const n = EmalNumber.fromString("520,73");
	expect(n).toMatchSnapshot();
});

test("serializes scientific numbers", () => {
	const str = "8,539e-4";
	const n = EmalNumber.fromString(str);
	expect(n.toString(3)).toEqual(str);
});

test("serializes simple numbers", () => {
	const str = "8.539";
	const n = EmalNumber.fromString(str);
	expect(n.toString(3)).toEqual(str.replace(".", ","));
});

test("can add numbers", () => {
	const a = EmalNumber.fromString("4.56e-2");
	const b = EmalNumber.fromString("1,07");

	expect(EmalNumber.add(a, b).toString(4)).toEqual("1,1156");
});

test("can divide numbers", () => {
	const a = EmalNumber.fromString("4.56e-2");
	const b = EmalNumber.fromString("1,07");

	expect(EmalNumber.div(a, b).toString()).toEqual("4,26e-2");
});
