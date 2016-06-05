'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as diagnostic from '../src/diagnostic';

suite('UiFlow Suggest Tests', () => {

	let fixturePath = path.join(__dirname, '..', '..', '__test', 'fixtures');
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fs.removeSync(fixturePath);
		fs.mkdirsSync(fixturePath);
		['ok.uif', 'diagnostic.uif'].forEach(basename => fs.copySync(path.join(fixtureSourcePath, basename), path.join(fixturePath, basename)));
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