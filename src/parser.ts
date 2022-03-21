'use strict';

import * as Parsimmon from 'parsimmon';
import { string, regex, optWhitespace, sepBy, lazy, alt, eof, all, seq, seqMap, succeed } from 'parsimmon';

import { Position as Pos } from 'vscode';

export interface Position {
	column: number;
	offset: number;
	line: number;
}

export interface Declarelation {
	label: string;
	text: string;
}

export interface Node extends Declarelation {
	start: Position;
	end: Position;
}

let lsec = regex(/.*\[/);
let rsec = regex(/\].*/);
let sectionText = regex(/[^#\]]+/).map(text => {return {label: 'section', text: text}; }).mark();
let rank = regex(/#*/);
let section = seqMap(lsec, sectionText, rsec, (...params) => params[1]);

let equal = regex(/=+/);
let lapi = string('{');
let rapi = string('}');
let api = regex(/[^}]+/).map(text => {return {label: 'api', text: text}; }).mark();
let directionText = regex(/.*/).map(text => {return {label: 'direction', text: text}; }).mark();
let lt = string('>').skip(optWhitespace);
let directionWithoutApi = seqMap(equal, lt, directionText, (...params) => params[2]);
let directionWithApi = seqMap(equal, lapi, api, rapi, equal, lt, directionText, (...params) => [params[2], params[6]]);
let direction = alt(directionWithoutApi, directionWithApi);

let text = regex(/.*/).mark().map(text => {
	return {label: 'text', text: text};
});

let line = optWhitespace.then(alt(section, direction, text));

let eol = regex(/\r?\n/);
let parser = sepBy<any, any>(line, eol);

export function walk(nodes: Node[], val: any) {
	if (val instanceof Array) {
		val.forEach(v => walk(nodes, v));
	}
	if (val instanceof Object) {
		var start, end: Pos;
		end = new Pos(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) /* @kexi fixme */
		if (val.hasOwnProperty('start')) start = val.start;
		if (val.hasOwnProperty('end')) end = val.end;
		if (val.hasOwnProperty('value')) {
			let value: Declarelation = val.value;
			nodes.push({label: value.label, text: value.text, start: start, end: end});
		}
	}
}

export function parse(code: string): Node[] {
	let ast: Parsimmon.Result<any> = parser.parse(code);
	if (!ast.status) {
		throw new Error("ast.expected.");
	}
	let nodes: Node[] = [];
	walk(nodes, ast.value);
	return nodes;
}
