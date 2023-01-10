import { Unit } from "./unit.js";

test("divides unit", () => {
	const mL = new Unit(19, 1, 0.001);
	const mol = new Unit(13, 1, 1);
	const result = new Unit(13, 19, 1000);

	expect(Unit.div(mol, mL)).toEqual(result);
});

test("stringifies unit", () => {
	const result = new Unit(13, 19, 1000);
	expect(result.toString()).toEqual("kmol/L");
});

test("creates from string", () => {
	const unit = Unit.fromString("mmol/mL")
	expect(unit.toString()).toEqual("mmol/mL");
});
