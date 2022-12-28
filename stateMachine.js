/// Emal – Acquire and process scientific data with ease
/// stateMachine.js – Handles state machines for tokenization.
///
/// State machines declared using this class are meant to transform a string
/// into an array of tokens.
/// This process is needed at multiple places in the project, so a global
/// unified implementation is used.

// A state machine uses states (JS functions) and 
export class StateMachine {
	constructor(startState, states, transformers) {
		this.startState = startState;
		this.states = states;
		this.transformers = transformers;
		this.transformed = false;
	}

	run(input, tokens = {}) {
		// The default token "_" contains everything not eaten under other
		// tokens, it is deleted afterwards.
		let currentToken = "_";
		tokens[currentToken] = "";

		// Declare utility states and functions
		function token(newToken) {
			tokens[newToken] = "";
			currentToken = newToken;
		}

		function eat(charCode) {
			tokens[currentToken] += String.fromCharCode(charCode);
		}

		function end() {
			return end;
		}

		function nok() {
			console.error("NOK");
			return end;
		}

		// Fake context is made of utilities and user-defined states
		let _this = { eat, token, end, nok };
		Object.assign(_this, this.states);

		let parsingState = this.states[this.startState];

		for(let charIdx = 0; charIdx < input.length; charIdx++) {
			const charCode = input.charCodeAt(charIdx);
			const result = parsingState.call(_this, charCode);

			if(typeof result === "function") {
				parsingState = result;
			}
		}

		this.tokens = tokens;
		this.transformed = false;

		delete tokens._;

		return this;
	}

	// Transformers can be applied after the tokenization happened, to
	// preprocess the tokens.
	transform() {
		if(this.transformed) return;

		for(const [tokenName, transformer] of Object.entries(this.transformers)) {
			if(Object.keys(this.tokens).includes(tokenName)) {
				this.tokens[tokenName] = transformer(this.tokens[tokenName]);
			}
		}

		this.transformed = true;

		return this;
	}
}
