import { UncertainValue } from "./uncertainty.js";

test("can add values", () => {
	const l1 = UncertainValue.fromString("2.05", "0.1");
	const l2 = UncertainValue.fromString("15.1", "1");

	const l = UncertainValue.add(l1, l2);
	expect(l.value.toString()).toEqual("1,72e1");
	expect(l.absU.toString()).toEqual("1,10");
});

test("can divide values", () => {
	const U = UncertainValue.fromString("2.05", "0.05");
	const I = UncertainValue.fromString("1.5e-3", "1e-4");

	const R = UncertainValue.div(U, I);
	expect(R.value.toString()).toEqual("1,37e3");
	expect(R.absU.toString()).toEqual("1,24e2");
});

test("can log values", () => {
	const cH3O = UncertainValue.fromString("1.1", "0.1");
	const pH = UncertainValue.log10(cH3O);

	expect(pH.value.toString()).toEqual("4,14e-2");
	expect(pH.absU.toString()).toEqual("3,91e-2");
});
