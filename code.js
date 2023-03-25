/// Emal – Acquire and process scientific data with ease
/// code.js – Emal code lexer and interpreter.
///
/// Copyright (C) 2023 Titouan (Stalone) S.
/// This program is free software: you can redistribute it and/or modify it
/// under the terms of the GNU Affero General Public License as published by
/// the Free Software Foundation, version 3.
///
/// The code lexer is a very simple state machine running on each line of
/// the user code. Each line expects a strict order: keyword, variable,
/// potential unit, equal sign and value or expression. Invalid lines are
/// discarded.

import { StateMachine } from "./stateMachine.js";
import { Expression } from "./expression.js";
import { isWhitespace } from "./matchers.js";

const VARIABLE_KW = "let";

function start(charCode) {
	// Eat leading spaces
	if(isWhitespace(charCode)) return start;

	this.token({}, "keyword");
	return this.keyword(charCode);
}

function keyword(charCode) {
	if(isWhitespace(charCode)) return this.afterKeyword(charCode);

	this.eat(charCode);
	return keyword;
}

function afterKeyword(charCode) {
	if(isWhitespace(charCode)) return afterKeyword;

	this.token({}, "variable");
	return this.variable(charCode);
}

function variable(charCode) {
	// 61 = "="
	if(charCode === 61) return this.equalSign(charCode); 
	if(isWhitespace(charCode)) return this.beforeEqual(charCode);
	// 95 = "_"
	if(charCode === 95) {
		this.token({}, "unit");
		return unit;
	}

	this.eat(charCode);
	return variable;
}

function unit(charCode) {
	// 61 = "="
	if(charCode === 61) return this.equalSign(charCode); 
	if(isWhitespace(charCode)) return this.beforeEqual(charCode);

	this.eat(charCode);
	return unit;
}

function beforeEqual(charCode) {
	if(charCode === 61) return this.equalSign(charCode);

	return beforeEqual;
}

function equalSign(charCode) {
	if(charCode !== 61) return this.nok(charCode);

	return afterEqual;
}

function afterEqual(charCode) {
	if(isWhitespace(charCode)) return afterEqual;

	this.token({}, "expression");
	return this.expression(charCode);
}

function expression(charCode) {
	if(isNaN(charCode)) return this.end(charCode);

	this.eat(charCode);
	return expression;
}

function toValue(token) {
	return token.value;
}

const lineSm = new StateMachine("start", {
	start,
	keyword,
	afterKeyword,
	variable,
	unit,
	beforeEqual,
	equalSign,
	afterEqual,
	expression,
}, {
	type: "parallel",
	transformers: {
		keyword: toValue,
		variable: toValue,
		unit: toValue,
		expression: tok => new Expression(tok.value),
	},
});

export class CodeBlock {
	constructor(codeStr) {
		this.lines = codeStr.split("\n").reduce((acc, line) => {
			const runnerOutput = lineSm.run(line).transform();
			if(!runnerOutput.hasThrown()) acc.push(runnerOutput.tokens);

			return acc;
		}, []);
	}

	// For now, evaluation simply consists of evaluating the expression
	// for each variable.
	evaluate(userData) {
		const generatedData = {};

		this.lines.forEach(line => {
			switch(line.keyword) {
				case VARIABLE_KW:
					const data = Object.assign({}, userData, generatedData);
					generatedData[line.variable] = line.expression.evaluate(data);
					break;
			}
		});

		return generatedData;
	}
}
