'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as diagnostic from '../../diagnostic';
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
		['ok.uif', 'diagnostic.uif'].forEach(
			basename => fs.copyFileSync(
				path.join(fixtureSourcePath, basename),
				path.join(fixturePath, basename)
			)
		);
	});

	test('Test provideCompletionItems#UiflowCompletionItemProvider', async () => {
		const testCases: [string, number][] = [
			['ok.uif', 0],
			['diagnostic.uif', 1]
		];
		testCases.map(async ([fileName, expected]) => {
			const doc = await vscode.workspace.openTextDocument(path.join(fixturePath, fileName));
			const diagnostics = diagnostic.createDiagnostics(doc);
			assert.equal(diagnostics.length, expected, `Diagnostics length must be ${1} in ${fileName}.`);
		});
	});
});