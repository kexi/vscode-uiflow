'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as definition from '../../definition';
import fs = require('fs');
import os = require('os');

suite('UiFlow Definition Tests', () => {

	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(
			path.join(fixtureSourcePath, 'definition.uif'),
			path.join(fixturePath, 'definition.uif')
		);
	});

	test('Test provideDefinition#UiflowDefinitionProvider', async () => {
		const doc = await vscode.workspace.openTextDocument(path.join(fixturePath, 'definition.uif'));
		const testCases: [vscode.Position, number|undefined][] = [
			[new vscode.Position(0, 0), undefined],
			[new vscode.Position(15, 3), 17],
			[new vscode.Position(15, 2), undefined],
			[new vscode.Position(26, 4), 9],
			[new vscode.Position(13, 4), undefined],
		];
		const instance = new definition.UiflowDefinitionProvider();
		testCases.forEach(
			async ([pos, expected]) => {
				const location: vscode.Definition|undefined = instance.provideDefinition(doc, pos, definition.definitionCancellationToken);
				if (location instanceof vscode.Location) {
					assert.equal(location.range.start.line, expected, `Definition line must be ${expected}.`);
				} else {
					assert.deepStrictEqual(location, undefined);
				}
			}
		);
	});
});