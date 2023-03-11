/// Emal – Acquire and process scientific data with ease
/// stateMachine.js – Handles state machines for tokenization.
///
/// State machines declared using this class are meant to transform a string
/// into tokens.
/// This process is needed at multiple places in the project, so a global
/// unified implementation is used.

const MS = {
	WAITING: 0,
	RUNNING: 1,
	PARSED: 2,
	TRANSFORMED: 3,
	ERROR: 4,
};

export class StateMachine {
	constructor(startState, states, options) {
		this.startState = startState;
		this.states = states;

		// Transformers can be applied after the tokenization happened, to
		// preprocess the tokens.
		this.transformers = options.transformers || {};
		// Two types of machines are possible: "serial" stores tokens
		// sequentially in an array, while "parallel" stores them in
		// an object, without any ordering.
		this.type = options.type || "parallel";

		this.currentState = MS.WAITING;
	}

	run(input, tokens) {
		const globalThis = this;

		// Default tokens value depends on the type of state machine
		if(typeof tokens === "undefined") {
			if(this.type === "sequential") tokens = new Array();
			else tokens = {};
		}

		let currentToken = -1;
		this.currentState = MS.RUNNING;

		// Declare utility states and functions
		function token(context, tokenName) {
			if(globalThis.type === "sequential") {
				currentToken++;
				tokens.push(Object.assign({}, context, { value: "" }));
			} else {
				currentToken = tokenName;
				tokens[currentToken] = Object.assign({}, context, { value: "" });
			}
		}

		// Delegate the parsing to another state machine
		function delegate(sm, context, tokenName) {
			const substr = input.substr(globalThis.position);
			const subRunner = sm.run(substr).transform();
			
			if(subRunner.hasThrown()) return false;

			// Remove one because position returned is length parsed + 1
			// Remove another one because the character loop had already counted one character.
			globalThis.position += subRunner.position - 2;

			const extendedContext = Object.assign({}, context, {
				children: subRunner.tokens,
			});

			token(extendedContext, tokenName);
			return true;
		}

		function eat(charCode) {
			tokens[currentToken].value += String.fromCharCode(charCode);
		}

		function mutate(context) {
			Object.assign(tokens[currentToken], context);
		}

		function eaten() {
			return tokens[currentToken].value;
		}

		function end() {
			globalThis.currentState = MS.PARSED;
			return end;
		}

		function nok() {
			globalThis.currentState = MS.ERROR;
			return nok;
		}

		// Fake context is made of utilities and user-defined states
		let _this = { token, delegate, eat, mutate, eaten, end, nok };
		Object.assign(_this, this.states);

		let parsingState = this.states[this.startState];

		for(this.position = 0; this.currentState === MS.RUNNING; this.position++) {
			const charCode = input.charCodeAt(this.position);
			const result = parsingState.call(_this, charCode);

			if(typeof result === "function") {
				parsingState = result;
			}

			// Force loop to end (on error) after end of input
			if(this.position >= input.length && this.currentState === MS.RUNNING) {
				this.currentState = MS.ERROR;
				break;
			}
		}

		this.tokens = tokens;

		return this;
	}

	transform() {
		if(this.currentState >= MS.TRANSFORMED) return this;

		for(const [tokenName, transformer] of Object.entries(this.transformers)) {
			if(Object.keys(this.tokens).includes(tokenName)) {
				this.tokens[tokenName] = transformer(this.tokens[tokenName]);
			}
		}

		this.currentState = MS.TRANSFORMED;

		return this;
	}

	hasThrown() {
		return this.currentState === MS.ERROR;
	}
}
