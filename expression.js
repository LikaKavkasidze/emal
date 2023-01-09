/// Emal – Acquire and process scientific data with ease
/// expression.js – Calculator for generic expressions.
///
/// An expression is a string representing operations to be done.
/// Example: 0.75 + 2 * x
/// Expressions are represented as a sequence of tokens, in Reverse
/// Polish Notation (RPN).

import { isWhitespace, isDigit, isSign, isOpeningBracket, isClosingBracket } from "./matchers.js";
import { EmalNumber, numberSm } from "./number.js";
import { StateMachine } from "./stateMachine.js";

const ATOMIC_FUNCTIONS = {
	"+": {
		priority: 1,
		methodName: "add",
	},
	"-": {
		priority: 1,
		methodName: "sub",
	},
	"*": {
		priority: 2,
		methodName: "mul",
	},
	"/": {
		priority: 2,
		methodName: "div",
	},
};

const ATOMIC_CHARS = Object.keys(ATOMIC_FUNCTIONS).map(c => c.charCodeAt(0));

function isOperator(charCode) {
	return ATOMIC_CHARS.includes(charCode);
}

function exprToken(charCode) {
	if(isDigit(charCode) || isSign(charCode)) {
		const hasDelegated = this.delegate(numberSm, { type: "number" });

		if(hasDelegated) {
			return exprToken;
		}
	}

	const opCond = isOperator(charCode);
	const obCond = isOpeningBracket(charCode);
	const cbCond = isClosingBracket(charCode);

	// Both operators and brackets are single-eaten under a token
	if(opCond || obCond || cbCond) {
		if(opCond) {
			this.token({
				type: "operator",
			});
		} else {
			this.token({
				type: "bracket",
				bracketType: cbCond ? "closing" : "opening",
			});
		}

		this.eat(charCode);
		return exprToken;
	}

	if(isWhitespace(charCode)) {
		return exprToken;
	}

	if(isNaN(charCode)) {
		return this.end(charCode);
	}

	this.token({ type: "variable" });
	return this.variable(charCode);
}

function variable(charCode) {
	if(isWhitespace(charCode) || isOperator(charCode) || isOpeningBracket(charCode) || isClosingBracket(charCode)) {
		return this.exprToken(charCode);
	}

	if(isNaN(charCode)) {
		return this.end(charCode);
	}

	this.eat(charCode);
	return variable;
}

const expressionSm = new StateMachine("exprToken", {
	exprToken,
	variable,
}, {
	type: "sequential"
});

export class Expression {
	constructor(expressionStr) {
		const runnerOutput = expressionSm.run(expressionStr);

		// State machine transformers cannot be used for sequential parsing
		const tokens = runnerOutput.tokens
			.map(tok => {
				if(tok.type === "number") {
					tok.children = EmalNumber.fromTokens(tok.children);
				}

				return tok;
			});

		// After the lexer, based on a sequential state machine, tokens needs
		// to be ordered in RPN. This code is based on Dijkstra's shunting
		// yard algorithm.
		const rpnOutput = tokens.reduce((acc, cur) => {
			switch(cur.type) {
				case "number":
				case "variable":
					acc.tokens.push(cur);
					break;

				case "operator":
					const currentPriority = ATOMIC_FUNCTIONS[cur.value].priority;
					let op = acc.stack.pop();

					while(op && op.type !== "bracket" && ATOMIC_FUNCTIONS[op.value].priority > currentPriority) {
						acc.tokens.push(op);
						op = acc.stack.pop();
					}

					// Push back last popped operator
					if(op) acc.stack.push(op);
					acc.stack.push(cur);
					break;

				case "bracket":
					if(cur.bracketType === "opening") {
						acc.stack.push(cur);
					} else {
						let op = acc.stack.pop();

						while(op && op.bracketType !== "opening") {
							acc.tokens.push(op);
							op = acc.stack.pop();
						}

						// Do not push anything back: brackets get discarded
					}
					break;
			}

			return acc;
		}, { tokens: [], stack: [] });

		// Fully pop remaining stack
		rpnOutput.stack.reverse().forEach(op => rpnOutput.tokens.push(op));

		this.tokens = rpnOutput.tokens;
	}

	// Evaluating an expression on a set of variables gives the result
	// of the operations represented by the tokens, replacing all variables
	// by their values.
	evaluate(variables) {
		return this.tokens.reduce((acc, tok) => {
			switch(tok.type) {
				case "number":
					acc.push(tok.children);
					break;
				
				case "variable":
					const value = variables[tok.value];
					acc.push(value);
					break;
	
				case "operator":
					const { methodName } = ATOMIC_FUNCTIONS[tok.value];
					const args = acc.splice(-2, 2);
					// Assume all arguments are of the same type
					const method = args[0].constructor[methodName];

					acc.push(method.apply(null, args));
					break;
			}
	
			return acc;
		}, [])[0];
	}
};
