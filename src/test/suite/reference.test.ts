'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import fs = require('fs');
import os = require('os');
import { referenceCancellationToken, UiflowReferenceProvider } from '../../reference';

suite('UiFlow Reference Tests', () => {
	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(
			path.join(fixtureSourcePath, 'reference.uif'),
			path.join(fixturePath, 'reference.uif')
		);
	});

	test('Test provideReferences#UiflowReferenceProvider', async () => {
		const doc = await vscode.workspace.openTextDocument(path.join(fixturePath, 'reference.uif'));
		const provider = new UiflowReferenceProvider();
		const position = new vscode.Position(6, 1);
		const context: vscode.ReferenceContext = {
			includeDeclaration: false
		};
		const locations = await provider.provideReferences(doc, position, context, referenceCancellationToken);
		const expected: vscode.Range[] = [
			new vscode.Range(10, 4, 10, 8),
			new vscode.Range(16, 4, 16, 8)
		];
		expected.forEach((range, i) => {
			if (locations) {
				assert.ok(range.isEqual(locations[i].range), `Range should be equal.`);
			}
		});
	});
});