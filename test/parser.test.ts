'use strict';

import * as assert from 'assert';
import {Parser} from '../src/parser';

suite('UiFlow Parser Tests', () => {
	test('Test parse', () => {
		let code = `[sec1]
see1
--
act1`;
		let parser = new Parser();
		let nodes = parser.parse(code);
		let section = nodes.find(n => n.label === 'section');
		assert.equal(section.text, 'sec1');
		assert.equal(section.start.line, 1);
		assert.equal(section.start.column, 2);
		assert.equal(section.start.offset, 1);
		assert.equal(section.end.line, 1);
		assert.equal(section.end.column, 6);
		assert.equal(section.end.offset, 5);

		let see = nodes.find(n => n.label === 'see');
		assert.equal(see.text, 'see1');
		assert.equal(see.start.line, 2);
		assert.equal(see.start.column, 1);
		assert.equal(see.start.offset, 7);
		assert.equal(see.end.line, 2);
		assert.equal(see.end.column, 5);
		assert.equal(see.end.offset, 11);

		let action = nodes.find(n => n.label === 'action');
		assert.equal(action.text, 'act1');
		assert.equal(action.start.line, 4);
		assert.equal(action.start.column, 1);
		assert.equal(action.start.offset, 15);
		assert.equal(action.end.line, 4);
		assert.equal(action.end.column, 5);
		assert.equal(action.end.offset, 19);
	});
});