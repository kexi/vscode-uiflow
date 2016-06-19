'use strict';

import * as Parsimmon from 'parsimmon';
import { string, regex, optWhitespace, sepBy, lazy, alt, eof, all, seq, seqMap, succeed } from 'parsimmon';

export interface Position {
	column: number;
	offset: number;
	line: number;
}

interface Declarelation {
	label: string;
	text: string;
}

export interface Node extends Declarelation {
	start: Position;
	end: Position;
}

enum State {
	section,
	endOfSee,
	endOfAction
}

let state = null;

function lexeme(p: Parsimmon.Parser<string>) {
	return p.skip(optWhitespace);
}

let eol = regex(/\n/);

namespace section {
	let lsec = string('[');
	let rsec = string(']');
	let name = regex(/[^#\]]*/).map(text => {
		state = State.section;
		return {label: 'section', text: text};
	}).mark();
	let rank = string('#').many();
	export let parser = lsec.then(name).skip(rank).skip(rsec);
}

namespace direction {
	let lapi = string('{');
	let rapi = string('}');
	let equal = string('=');
	let eoe = string('>').skip(regex(/[ \f\n\r\t\v]*/));
	let api = lapi.then(regex(/[^}]*/)).map<Declarelation>(text => {return {label: 'api', text: text}; }).mark().skip(rapi);
	let directionName = regex(/[^\n]+/).map<Declarelation>(text => {return {label: 'direction', text: text}; }).mark();
	let directionLine = seqMap(equal.atLeast(1), api.atMost(1), equal.atLeast(1), eoe, directionName, (_, api, __, ___, dr) => {return [api, dr]; });
	export let parser = directionLine;
}

namespace text {
	let textLine = regex(/.*/).map<Declarelation>(text => {
		let l: string = state === State.section ? 'see' : 'action';
		return {label: l, text: text};
	});
	export let parser = textLine.mark();
}

namespace endOfSee {
	let endOfSee = regex(/-+/).mark().map(text => {
		state = State.endOfSee;
		return {label: 'endOfSee', text: text};
	});
	export let parser = endOfSee.mark();
}

let lineParser = alt(section.parser, direction.parser, endOfSee.parser, text.parser);
let parser = sepBy(lineParser, eol);

function walk(nodes: Node[], val: any) {
	if (val instanceof Array) {
		val.forEach(v => walk(nodes, v));
	}
	if (val instanceof Object) {
		let start, end: Position;
		if (val.hasOwnProperty('start')) start = val.start;
		if (val.hasOwnProperty('end')) end = val.end;
		if (val.hasOwnProperty('value')) {
			let value: Declarelation = val.value;
			nodes.push({label: value.label, text: value.text, start: start, end: end});
		}
	}
}

export class Parser {
	parse(code: string): Node[] {
		state = null;
		let ast: Parsimmon.Result<string> = parser.parse(code);
		if (!ast.status) {
			throw new Error(ast.expected);
		}
		let nodes: Node[] = [];
		walk(nodes, ast.value);
		return nodes;
	}
}
