'use strict';

import * as assert from 'assert';
import * as parser from '../src/parser';

suite('UiFlow Parser Tests', () => {
	test('Test parse', () => {
		let code = `[sec1]
see1
--
act1
={api}=>direction1`;
		let nodes = parser.parse(code);
		let section = nodes.find(n => n.label === 'section');
		assert.equal(section.text, 'sec1');
		assert.equal(section.start.line, 1);
		assert.equal(section.start.column, 2);
		assert.equal(section.start.offset, 1);
		assert.equal(section.end.line, 1);
		assert.equal(section.end.column, 6);
		assert.equal(section.end.offset, 5);

		let direction = nodes.find(n => n.label === 'direction');
		assert.equal(direction.text, 'direction1');
		assert.equal(direction.start.line, 5);
		assert.equal(direction.start.column, 9);
		assert.equal(direction.start.offset, 28);
		assert.equal(direction.end.line, 5);
		assert.equal(direction.end.column, 19);
		assert.equal(direction.end.offset, 38);

	});
});