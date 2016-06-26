'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { UiflowRenameProvider } from '../src/rename';

suite('UiFlow Rename Tests', () => {

	let fixturePath = path.join(__dirname, '..', '..', '__test', 'fixtures');
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fs.removeSync(fixturePath);
		fs.mkdirsSync(fixturePath);
		fs.copySync(path.join(fixtureSourcePath, 'rename.uif'), path.join(fixturePath, 'rename.uif'));
	});

	test('Test provideRenameEdits#UiflowRenameProvider', done => {
		vscode.workspace.openTextDocument(path.join(fixturePath, 'rename.uif'))
		.then(doc => {
			let position = new vscode.Position(4, 4);
			let newName = 'sec1';
			let provider = new UiflowRenameProvider();
			return provider.provideRenameEdits(doc, position, newName, null)
			.then((we: vscode.WorkspaceEdit) => {
				let expected: vscode.Range[] = [
					new vscode.Range(0, 1, 0, 8),
					new vscode.Range(4, 4, 4, 11),
					new vscode.Range(10, 4, 10, 11)
				];
				let edits = we.get(doc.uri);
				expected.forEach((range, i) => {
					assert.ok(range.isEqual(edits[i].range), `Range should be equal.`);
				});
			});
		}, reason => assert.ok(false, `Error in openTextDocument ${reason}.`))
		.then(() => done(), reason => done(reason));
	});
});