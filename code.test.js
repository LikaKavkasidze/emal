import { CodeBlock } from "./code.js";
import { EmalNumber } from "./number.js";

test("parses code", () => {
	const cb = new CodeBlock(`let a0 = 2

	let y = x / a0`);

	expect(cb.lines).toMatchSnapshot();
});

test("evaluates code", () => {
	const cb = new CodeBlock(`let a0 = 2

	let y = x / a0`);

	const data = { x: EmalNumber.fromString("1.2") };
	expect(cb.evaluate(data).y.toString()).toEqual("6,00e-1");
});
