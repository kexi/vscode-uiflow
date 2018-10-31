'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as suggest from '../src/suggest';
import fs = require('fs');
import os = require('os');

suite('UiFlow Suggest Tests', () => {

	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(path.join(fixtureSourcePath, 'suggest.uif'), path.join(fixturePath, 'suggest.uif'));
	});

	test('Test provideCompletionItems#UiflowCompletionItemProvider', done => {
		vscode.workspace.openTextDocument(path.join(fixturePath, 'suggest.uif'))
			.then(doc => {
				let testCases: [vscode.Position, string[]][] = [
					[new vscode.Position(13, 3), ['seg1', 'seg2', 'seg3']],
					[new vscode.Position(13, 2), []],
					[new vscode.Position(8, 7), ['seg1', 'seg2', 'seg3']],
					[new vscode.Position(8, 6), []]
				];
				let instance = new suggest.UiflowCompletionItemProvider();
				let promises = testCases.map(([pos, exp]) => instance.provideCompletionItems(doc, pos, null)
				.then(list => {
					assert.equal(list.length, exp.length, `List length must be ${exp.length}`);
					let items = list.map(l => l.label);
					for (let i of exp) {
						assert.ok(items.indexOf(i) >= 0, `Item(${i}) not found in list.`);
					}
				}));
				return Promise.all(promises);
			}, reason => assert.ok(false, `Error in openTextDocument ${reason}.`))
			.then(() => done(), reason => done(reason));
	});
});