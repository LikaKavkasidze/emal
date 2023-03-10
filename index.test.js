import { EmalManager } from "./index.js";
import { EmalNumber } from "./number.js";

test("declares columns", () => {
	const app = new EmalManager();
	app.addUserColumn("V", "mL");
	app.addUserColumn("n", "mmol");

	expect(app.columns).toMatchSnapshot();
});

test("declares rows", () => {
	const app = new EmalManager();
	app.addUserColumn("V", "mL");
	app.addData({ V: EmalNumber.fromString("2.1") });
	app.addData({ V: EmalNumber.fromString("3.3") });

	expect(app.rows).toMatchSnapshot();
});

test("allows computed columns - finds unit", () => {
	const app = new EmalManager();
	app.addUserColumn("V", "mL");
	app.addUserColumn("n", "mmol");
	app.addComputedColumn("c", "n/V");
	expect(app.getColumn("c").unit.toString()).toEqual("mol/L");
});

test("allows computed columns - propagates", () => {
	const app = new EmalManager();
	app.addUserColumn("V", "mL");
	app.addUserColumn("n", "mmol");
	app.addComputedColumn("c", "n/V");
	app.addData({ V: EmalNumber.fromString("2.1"), n: EmalNumber.fromString("1e1") });

	expect(app.rows[0].c.toString()).toEqual("4,76");
});
