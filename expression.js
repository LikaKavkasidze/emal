/// Emal – Acquire and process scientific data with ease
/// expression.js – Calculator for generic expressions.
///
/// An expression is a string representing operations to be done.
/// Example: 0.75 + 2 * log(x)
/// Expressions are represented as a sequence of tokens, in Reverse
/// Polish Notation (RPN).

import { isWhitespace, isDigit, isSign, isOpeningBracket, isClosingBracket, isCommaSeparator } from "./matchers.js";
import { EmalNumber, numberSm } from "./number.js";
import { StateMachine } from "./stateMachine.js";

const EEXPR_OPERATORS = {
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

const EEXPR_FUNCTIONS = {
	"log": {
		argumentCount: 1,
		methodName: "log10",
	},
	"max": {
		argumentCount: 2,
		methodName: "max",
	},
};

const EEXPR_OPERATOR_CHARS = Object.keys(EEXPR_OPERATORS).map(c => c.charCodeAt(0));
const EEXPR_FUNCTION_NAMES = Object.keys(EEXPR_FUNCTIONS);

function isOperator(charCode) {
	return EEXPR_OPERATOR_CHARS.includes(charCode);
}

function exprToken(charCode) {
	if(isDigit(charCode) || isSign(charCode)) {
		const hasDelegated = this.delegate(numberSm, { type: "number" });

		if(hasDelegated) {
			return exprToken;
		}
	}

	const opCond = isOperator(charCode);
	const csCond = isCommaSeparator(charCode);
	const obCond = isOpeningBracket(charCode);
	const cbCond = isClosingBracket(charCode);

	// Operators, brackets and commas are single-eaten under a token
	if(opCond || csCond || obCond || cbCond) {
		if(opCond) {
			this.token({
				type: "operator",
			});
		} else if(csCond) {
			this.token({
				type: "comma",
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

	// By default, token is expected to be a variable and will later be
	// mutated if the name matches a function name.
	this.token({ type: "variable" });
	return this.variableOrFunction(charCode);
}

function variableOrFunction(charCode) {
	if(isWhitespace(charCode) || isOperator(charCode) || isOpeningBracket(charCode) || isClosingBracket(charCode) || isCommaSeparator(charCode)) {
		// Mutate token to function if a function name is found
		if(EEXPR_FUNCTION_NAMES.includes(this.eaten())) {
			this.mutate({ type: "function" });
		}

		return this.exprToken(charCode);
	}

	if(isNaN(charCode)) {
		// Mutate token to function if a function name is found
		if(EEXPR_FUNCTION_NAMES.includes(this.eaten())) {
			this.mutate({ type: "function" });
		}

		return this.end(charCode);
	}

	this.eat(charCode);
	return variableOrFunction;
}

const expressionSm = new StateMachine("exprToken", {
	exprToken,
	variableOrFunction,
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

				case "function":
					acc.stack.push(cur);
					break;

				case "operator":
					const currentPriority = EEXPR_OPERATORS[cur.value].priority;
					let op = acc.stack.pop();

					while(op && op.type !== "bracket" && EEXPR_OPERATORS[op.value].priority > currentPriority) {
						acc.tokens.push(op);
						op = acc.stack.pop();
					}

					// Push back last popped operator
					if(op) acc.stack.push(op);
					acc.stack.push(cur);
					break;

				case "bracket":
				case "comma":
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
					const opMethodName = EEXPR_OPERATORS[tok.value].methodName;
					const opArgs = acc.splice(-2, 2);
					// Assume all arguments are of the same type
					const opMethod = opArgs[0].constructor[opMethodName];

					acc.push(opMethod.apply(null, opArgs));
					break;

				case "function":
					const { methodName, argumentCount } = EEXPR_FUNCTIONS[tok.value];
					const args = acc.splice(-argumentCount, argumentCount);
					const method = args[0].constructor[methodName];

					acc.push(method.apply(null, args));
					break;
			}
	
			return acc;
		}, [])[0];
	}
};
