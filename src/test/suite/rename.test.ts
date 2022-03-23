'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { renameCancellationToken, UiflowRenameProvider } from '../../rename';
import fs = require('fs');
import os = require('os');

suite('UiFlow Rename Tests', () => {

	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'suite', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(path.join(fixtureSourcePath, 'rename.uif'), path.join(fixturePath, 'rename.uif'));
	});

	test('Test provideRenameEdits#UiflowRenameProvider', async () => {
		const doc = await vscode.workspace.openTextDocument(path.join(fixturePath, 'rename.uif'));
		const position = new vscode.Position(4, 4);
		const newName = 'sec1';
		const provider = new UiflowRenameProvider();
		const we = await provider.provideRenameEdits(doc, position, newName, renameCancellationToken);
		const expected: vscode.Range[] = [
			new vscode.Range(0, 1, 0, 8),
			new vscode.Range(4, 4, 4, 11),
			new vscode.Range(10, 4, 10, 11)
		];
		if (we) {
			const edits = we.get(doc.uri);
			expected.forEach((range, i) => {
				assert.ok(range.isEqual(edits[i].range), `Range should be equal.`);
			});
		}

	});
});