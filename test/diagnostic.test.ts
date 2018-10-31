'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as diagnostic from '../src/diagnostic';
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
		['ok.uif', 'diagnostic.uif'].forEach(
			basename => fs.copyFileSync(
				path.join(fixtureSourcePath, basename),
				path.join(fixturePath, basename)
			)
		);
	});

	test('Test provideCompletionItems#UiflowCompletionItemProvider', done => {
		let testCases: [string, number][] = [
			['ok.uif', 0],
			['diagnostic.uif', 1]
		];
		let all = testCases.map(([fileName, expected]) => {
			return vscode.workspace.openTextDocument(path.join(fixturePath, fileName))
			.then(doc => {
				let diagnostics = diagnostic.createDiagnostics(doc);
				assert.equal(diagnostics.length, expected, `Diagnostics length must be ${1} in ${fileName}.`);
			}, reason => assert.ok(false, `Error in openTextDocument ${reason}.`));
		});
		Promise.all(all).then(() => done(), reason => done(reason));
	});
});