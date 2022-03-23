'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as suggest from '../../suggest';
import fs = require('fs');
import os = require('os');

suite('UiFlow Suggest Tests', () => {

	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'suite', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(path.join(fixtureSourcePath, 'suggest.uif'), path.join(fixturePath, 'suggest.uif'));
	});

	test('Test provideCompletionItems#UiflowCompletionItemProvider', async () => {
		const doc = await vscode.workspace.openTextDocument(path.join(fixturePath, 'suggest.uif'));
		const testCases: [vscode.Position, string[]][] = [
			[new vscode.Position(13, 3), ['seg1', 'seg2', 'seg3']],
			[new vscode.Position(13, 2), []],
			[new vscode.Position(8, 7), ['seg1', 'seg2', 'seg3']],
			[new vscode.Position(8, 6), []]
		];
		const instance = new suggest.UiflowCompletionItemProvider();
		testCases.map(([pos, exp]) => {
			const list = instance.provideCompletionItems(doc, pos, suggest.completionItemCancellationToken);
			assert.equal(list.length, exp.length, `List length must be ${exp.length}`);
			const items = list.map((l:any) => l.label);
			for (const i of exp) {
				assert.ok(items.indexOf(i) >= 0, `Item(${i}) not found in list.`);
			}
		});
	});
});