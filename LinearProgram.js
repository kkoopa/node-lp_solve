'use strict'
var lp_solve = require('bindings')('lp_solve').LinearProgram;


function LinearProgram() {
	this.Columns = { };
	this.lp_solve = new lp_solve();
}

LinearProgram.prototype.addColumn = function(name) {
	
	var id = this.Columns[name] = Object.keys(this.Columns).length + 1;

	if (name === undefined) {
		name = "unamed_" + id;
	}

	this.lp_solve.addColumn(name, id);

	return name;
}

LinearProgram.ConstraintTypes = {'LE':1,'EQ':3,'GE':2};

LinearProgram.prototype.addConstraint = function(row, constraint, constant, name) {
	var rowId = [];
	var rowValues = [];
	var raw = row.raw;

	for (var k in raw) {
		if (k !== 'constant') {
			rowValues.push(raw[k]);
			rowId.push(this.Columns[k]);
		} else {
			constant -= raw[k];
		}
	}

	var constrainttype = LinearProgram.ConstraintTypes[constraint];

	return this.lp_solve.addConstraint(name, rowId, rowValues, constrainttype, constant);
}

LinearProgram.prototype.setObjective = function(row, minimize) {
	var rowId = [];
	var rowValues = [];
	var raw = row.raw;

	for (var k in raw) {
		if (k !== 'constant') {
			rowValues.push(raw[k]);
			rowId.push(this.Columns[k]);
		} else {
			this.adjustObjective = raw[k];
		}
	}

	if (minimize === undefined) minimize = true;

	return this.lp_solve.setObjective(minimize, rowId, rowValues);
}

LinearProgram.SolveResult = {
	'-5': 'UNKNOWNERROR',
	'-4': 'DATAIGNORED',
	'-3': 'NOBFP',
	'-2': 'NOMEMORY',
	'-1': 'NOTRUN',
	'0': 'OPTIMAL',
	'1': 'SUBOPTIMAL',
	'2': 'INFEASIBLE',
	'3': 'UNBOUNDED',
	'4': 'DEGENERATE',
	'5': 'NUMFAILURE',
	'6': 'USERABORT',
	'7': 'TIMEOUT',
	'8': 'RUNNING',
	'9': 'PRESOLVED'
};

LinearProgram.prototype.solve = function() {
	var res = this.lp_solve.solve();

	if (res == 0 || res == 1 || res ==9) 
		this.solutionVariables = this.getSolutionVariables();
	
	return { code: res, description: LinearProgram.SolveResult[res] };
}

LinearProgram.prototype.getObjectiveValue = function() {
	return this.lp_solve.getObjectiveValue() + (this.adjustObjective || 0);
}

LinearProgram.prototype.getSolutionVariables = function() {
	return this.lp_solve.getSolutionVariables();
}

LinearProgram.prototype.calculate = function(row) {
	var val = 0;
	var raw = row.raw;
	for (var k in raw) {
		val += this.get(k) * raw[k];
	}
	return val;
}

LinearProgram.prototype.get = function(variable) {
	if (variable == 'constant') return 1;
	return this.solutionVariables[this.Columns[variable] - 1];
}

module.exports = LinearProgram;