/// Emal – Acquire and process scientific data with ease
/// index.js – Library entry point: data manager.
///
/// Copyright (C) 2023 Titouan (Stalone) S.
/// This program is free software: you can redistribute it and/or modify it
/// under the terms of the GNU Affero General Public License as published by
/// the Free Software Foundation, version 3.
///
/// Emal manager is the central part of the library: it
/// gathers together all other modules, and allows simple
/// access and update of the data.
/// The manager stores columns and rows independently, and
/// computes all derived values.

import { Expression } from "./expression.js";
import { EmalNumber } from "./number.js";
import { Unit } from "./unit.js";

class Column {
	constructor(name) {
		this.name = name;
		this.isComputed = false;
		this.dependents = new Array();
	}

	setUnit(unit) {
		if(typeof unit === "string") {
			this.unit = Unit.fromString(unit);
		} else {
			this.unit = unit;
		}
	}

	// A column can handle an expression used to compute uncertainty
	// for all data rows belonging to the column.
	setUncertainty(uncertainty) {
		this.uncertainty = uncertainty;
	}

	setComputeExpression(expressionStr) {
		this.isComputed = true;
		this.expression = new Expression(expressionStr);
	}

	computeValueFor(data) {
		if(!this.isComputed) return 0;

		return this.expression.evaluate(data);
	}

	// A column has dependees, which will cause update
	// of the column data when they are updated.
	dependsOn() {
		if(!this.isComputed) return [];

		return Array.from(new Set(this.expression.tokens
			.filter(tok => tok.type === "variable")
			.map(tok => tok.value)));
	}

	addDependent(column) {
		this.dependents.push(column);
	}
}

export class EmalManager {
	constructor() {
		this.columns = new Array();
		this.rows = new Array();
		this.constants = new Array();
	}

	addUserColumn(name, unitStr, uncertainty) {
		const column = new Column(name);
		column.setUnit(unitStr);
		column.setUncertainty(uncertainty);

		this.columns.push(column);
	}

	addComputedColumn(name, expressionStr) {
		const column = new Column(name);
		column.setComputeExpression(expressionStr);

		const dependsOn = column.dependsOn();
		const dependsOnUnits = {};
		
		// Each column on which the current on depends
		// needs to notify when updated.
		dependsOn.forEach(columnName => {
			const dependsOnColumn = this.getColumn(columnName);

			dependsOnColumn.addDependent(column);
			dependsOnUnits[columnName] = dependsOnColumn.unit;
		});

		// Compute unit from column dependees
		const unit = column.computeValueFor(dependsOnUnits);
		column.setUnit(unit);

		this.columns.push(column);
	}

	getColumn(name) {
		return this.columns.find(col => col.name === name);
	}

	addConstant(name, unitStr, valueStr) {
		this.constants.push({
			name,
			unit: Unit.fromString(unitStr),
			value: EmalNumber.fromString(valueStr),
		});
	}

	addData(userData) {
		// TODO: loop to computed dependents' dependents and so on + test
		const dependents = Object.keys(userData).reduce((acc, columnName) => {
			this.getColumn(columnName)
				.dependents
				.forEach(col => acc.add(col));

			return acc;
		}, new Set());

		const computedData = {};

		dependents.forEach(dependent => {
			computedData[dependent.name] = dependent.computeValueFor(userData);
		});

		const allData = Object.assign({}, userData, computedData);

		this.rows.push(allData);
	}
}
