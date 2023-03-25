/// Emal – Acquire and process scientific data with ease
/// fit.js – Tools for curve fitting.
///
/// Curve fitting uses uncertainty-weighted least squares, solved using a
/// gradient descent. For proposed models, potential values for the parameters
/// are guessed to improve convergence.
/// Propagation of the uncertainties is done based on a statistical method
/// which involves finding roots of a non-linear equation.

const EFIT_DEFAULT_GRADIENT_STEP = 0.001;
const EFIT_DEFAULT_DESCENT_STEP = 0.01;
const EFIT_DEFAULT_MAX_ITERATIONS = 100000;
const EFIT_DEFAULT_GRAD_CONVERGENCE_LIMIT = 0.001;

const EFIT_DEFAULT_CONVERGENCE_LIMIT = 0.00001;
const EFIT_DEFAULT_MINMAX_STEP = 0.1;

// Implementation of a gradient descent algorithm, used to find stationnary
// values of a multivariate function. The principle is to compute the gradient
// of the function and follow the direction of the gradient by a small step
// (descentStep) before starting over.
// The algorithm ends when the maximal number of iteration is excedeed or
// when the gradient is small enough to conclude the current place is a
// stationnary point.
export function gradientDescent(f, variables, parameters = {}) {
	// All parameters are optional
	const gradientStep = typeof parameters.gradientStep === "number" ? parameters.gradientStep : EFIT_DEFAULT_GRADIENT_STEP;
	let descentStep = typeof parameters.descentStep === "number" ? parameters.descentStep : EFIT_DEFAULT_DESCENT_STEP;
	const maxIterations = typeof parameters.maxIterations === "number" ? parameters.maxIterations : EFIT_DEFAULT_MAX_ITERATIONS;
	const convergenceLimit = typeof parameters.convergenceLimit === "number" ? parameters.convergenceLimit : EFIT_DEFAULT_GRAD_CONVERGENCE_LIMIT;

	let currentX = variables.slice();
	let currentY = f(...currentX);
	let gradientNorm = Number.MAX_VALUE;
	let prevGradient = new Array(currentX.len).fill(0);
	let iterationCount = 0;

	while(gradientNorm > convergenceLimit && iterationCount < maxIterations) {
		const gradient = currentX.reduce((acc, v, i) => {
			// Clone current X
			const xDx = currentX.slice();

			// Use backward Euler method for derivative
			xDx[i] = v + gradientStep;
			const iGradient = (f(...xDx) - currentY) / gradientStep;

			acc.push(iGradient);
			return acc;
		}, []);

		currentX = currentX.map((v, i) => v - descentStep * gradient[i]);
		currentY = f(...currentX);

		let signChange = false;
		gradientNorm = 0;

		// Strategy to try to converge: the descent step is divided
		// by two when the gradient contains a sign change and is
		// multiplied by two when it does not.
		for(let i = 0; i < gradient.length; i++) {
			// Norm used is L^2, ie. square of individual components of gradient
			gradientNorm += gradient[i] * gradient[i];

			if(Math.sign(gradient[i]) !== Math.sign(prevGradient[i])) {
				signChange = true;
			}
		}

		if(signChange) descentStep /= 2;
		else descentStep *= 2;

		prevGradient = gradient;
		iterationCount++;
	}

	return currentX;
}

// Implementation of the Newton method to find roots of a function. Here again
// we follow the derivative of the function, but this time to find the
// intersection of this derivative with zero. The next step will start over
// with the value of the function where the derivative was zero.
// The algorithm here works for multivariate functions, and finds the zero
// by varying each parameter independently.
export function newtonRoots(f, initialVariables, parameters = {}) {
	const maxIterations = typeof parameters.maxIterations === "number" ? parameters.maxIterations : EFIT_DEFAULT_MAX_ITERATIONS;
	const convergenceLimit = typeof parameters.convergenceLimit === "number" ? parameters.convergenceLimit : EFIT_DEFAULT_CONVERGENCE_LIMIT;
	const derivStep = typeof parameters.derivStep === "number" ? parameters.derivStep : EFIT_DEFAULT_GRADIENT_STEP;

	const roots = [];

	for(let i = 0; i < initialVariables.length; i++) {
		let currentVariables = initialVariables.slice();
		let currentY = f(...currentVariables);
		let iterationCount = 0;

		while(Math.abs(currentY) > convergenceLimit && iterationCount < maxIterations) {
			currentVariables[i] -= derivStep;

			// Use backward Euler method for derivative
			const derivative = (currentY - f(...currentVariables)) / derivStep;
			currentVariables[i] -= currentY / derivative - derivStep;

			currentY = f(...currentVariables);
			iterationCount++;
		}

		roots.push(currentVariables);
	}

	return roots;
}

const EFIT_DEFAULT_MODELS = {
	"constant": (_, a) => a,
	"linear": (x, a, b) => a * x + b,
	"quadratic": (x, a, b, c) => a * x * x + b * x + c,
	"inverse": (x, a) => a / x,
	"exponential": (x, a, b) => a * Math.exp(b * x),
};

export class FitBuilder {
	constructor(model) {
		if(typeof model !== "function") {
			this.model = model;
			model = EFIT_DEFAULT_MODELS[model];
		} else {
			this.model = "unknown";
		}

		this.modelFn = model;

		// First parameter is the x value
		this.parameterCount = model.length - 1;

		// Construct function to be minimised using xi-squared method
		this.functionBuilder = function functionBuilder(xs, ys, uys) {
			// `arguments` will refer to this function arguments, which
			// are the coefficients to be found.
			return function fitFunction() {
				let xiSquared = 0;
		
				for(let i = 0; i < Math.min(xs.length, ys.length); i++) {
					const x = xs[i];
					const y = ys[i];
					const uy = uys[i];
		
					const partialXi = (y - model(x, ...arguments)) / uy;
		
					xiSquared += partialXi * partialXi;
				}
		
				return xiSquared;
			};
		};
	}

	solve(xs, ys, uys) {
		const fitFunction = this.functionBuilder(xs, ys, uys);
		const startParameters = new Array(this.parameterCount).fill(0);

		// Try to make a guess of the parameters to converge faster
		switch(this.model) {
			case "constant":
				startParameters[0] = ys[0];
				break;
			case "linear":
				startParameters[0] = (ys[ys.length - 1] - ys[0]) / (xs[ys.length - 1] - xs[0]);
				startParameters[1] = ys[0] - xs[0] * startParameters[0];
				break;
			case "quadratic":
				// Select three points: first, last and middle
				const xa = xs[0];
				const ya = ys[0];
				const xb = xs[Math.floor(ys.length / 2)];
				const yb = ys[Math.floor(ys.length / 2)];
				const xc = xs[ys.length - 1];
				const yc = ys[ys.length - 1];

				startParameters[0] = ((ya - yc) * (xb - xc) + (yb - yc) * (xc - xa)) / ((xb - xc) * (xa * xa - xc * xc) + (xa - xc) * (xc * xc - xb * xb));
				startParameters[1] = (yb - yc + startParameters[0] * xc * xc - startParameters[0] * xb * xb) / (xb - xc);
				startParameters[2] = yc - startParameters[0] * xc * xc - startParameters[1] * xc;
				break;
			case "inverse":
				startParameters[0] = xs[Math.floor(ys.length / 2)] * ys[Math.floor(ys.length / 2)];
				break;
			case "exponential":
				const xaRatio = xs[0] / (xs[ys.length - 1] - xs[0]);
				const xbRatio = xs[ys.length - 1] / (xs[ys.length - 1] - xs[0]);

				startParameters[1] = Math.pow(ys[0], xbRatio) / Math.pow(xs[ys.length - 1], xaRatio);
				startParameters[0] = 1 / xs[ys.length - 1] * Math.log(ys[ys.length - 1] / startParameters[1]);
				break;
		}

		// Find the parameters
		const result = gradientDescent(fitFunction, startParameters);

		// To get uncertainty, the said dln(L) rule is used. The principle is
		// to update the parameters until fit function (xi square) is modified
		// by +1. In order to find these parameters, we use Newton's method to 
		// find the zeros of `f(a + da, b + db) - min_{a,b} f - 1` in da and db.
		const fitFunctionMin = fitFunction(...result);

		function minRoots() {
			const parameters = result.map((v, i) => v - arguments[i]);
			return fitFunction(...parameters) - fitFunctionMin - 1;
		}

		let startUncertainty = new Array(this.parameterCount).fill(EFIT_DEFAULT_MINMAX_STEP);
		const uncertaintyHigh = newtonRoots(minRoots, startUncertainty);

		startUncertainty.fill(-EFIT_DEFAULT_MINMAX_STEP);
		const uncertaintyLow = newtonRoots(minRoots, startUncertainty);

		const uncertainty = new Array(uncertaintyHigh.length);

		for(let i = 0; i < uncertaintyHigh.length; i++) {
			uncertainty[i] = Math.abs(uncertaintyHigh[i][i] - uncertaintyLow[i][i]);
		}

		const realMean = ys.reduce((acc, y) => {
			return acc + y / ys.length;
		}, 0);
		let rSquaredNum = 0;
		let rSquaredDen = 0;

		for(let i = 0; i < ys.length; i++) {
			const realValue = ys[i];
			const predictedValue = this.modelFn(xs[i], ...result);

			rSquaredNum += (predictedValue - realMean) * (predictedValue - realMean);
			rSquaredDen += (realValue - realMean) * (realValue - realMean);
		}

		const rSquared = rSquaredNum / rSquaredDen;

		return { result, uncertainty, rSquared };
	}
}
