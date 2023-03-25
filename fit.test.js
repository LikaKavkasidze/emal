import { gradientDescent, newtonRoots, FitBuilder } from "./fit.js";

function round(x) {
	return Math.round(x * 100) / 100;
}

test("finds minimal value of a function", () => {
	function parabola2D(x, y) {
		return 3 * x * x + 2 * y * y + x * y - 3 * x - 2 * y - 1;
	}

	const result = gradientDescent(parabola2D, [0.5, 0.5])
		.map(v => round(v));
	expect(result).toEqual([round(10 / 23), round(9 / 23)]);
});

test("finds root of an equation", () => {
	const result = newtonRoots(x => x * x - 2 * x, [1.1]);
	expect(round(result)).toEqual(2.0);
});

test("fits linear function", () => {
	const xs = [1, 2, 3, 4, 5, 6, 7.1, 8, 9, 10.1];
	const ys = [97.033, 151.64, 194.74, 256.21, 291.70, 337.27, 365.34, 388.61, 407.41, 416.05];
	const uys = new Array(ys.length).fill(5);

	const linearFit = new FitBuilder("linear");
	let { result, uncertainty, rSquared } = linearFit.solve(xs, ys, uys);

	result = result.map(v => round(v));
	uncertainty = uncertainty.map(v => round(v));

	expect(result).toEqual([36.11, 91.24]);
	expect(uncertainty).toEqual([0.48, 2.01]);
	expect(round(rSquared)).toEqual(0.96);
});

test("fits quadratic function", () => {
	const xs = [1, 2, 3, 4, 5, 6, 7.1, 8, 9, 10.1];
	const ys = [97.033, 151.64, 194.74, 256.21, 291.70, 337.27, 365.34, 388.61, 407.41, 416.05];
	const uys = new Array(ys.length).fill(5);

	const linearFit = new FitBuilder("quadratic");
	let { result, uncertainty } = linearFit.solve(xs, ys, uys);

	result = result.map(v => round(v));
	uncertainty = uncertainty.map(v => round(v));

	expect(result).toEqual([-2.91, 68.21, 26.95]);
	// TODO: uncertainty on last parameter is quite high...
	expect(uncertainty).toEqual([0.03, 1.29, 16.48]);
});

test.skip("fits exponential function", () => {
	const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const ys = [2.82, 2.70, 2.44, 2.18, 1.90, 1.76, 1.55, 1.47, 1.31, 1.12];
	const uys = ys.map(v => v / 10);

	const linearFit = new FitBuilder("exponential");
	let {result, uncertainty} = linearFit.solve(xs, ys, uys);

	result = result.map(v => round(v));
	uncertainty = uncertainty.map(v => round(v));

	expect(result).toEqual([3.25, -0.1]);
	expect(uncertainty).toEqual([0.03, 1.29]);
});
