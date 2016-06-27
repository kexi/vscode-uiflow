'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as extension from '../src/extension';
import * as fs from 'fs-extra';
import { setResovleExportPath } from '../src/export';

suite('UiFlow Extension Tests', () => {
	let fixturePath = path.join(__dirname, '..', '..', '__test', 'fixtures');
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fs.removeSync(fixturePath);
		fs.mkdirsSync(fixturePath);
		fs.copySync(path.join(fixtureSourcePath, 'ok.uif'), path.join(fixturePath, 'ok.uif'));
	});

	test('Open Preview', done => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'ok.uif'));
		vscode.workspace.openTextDocument(uri).then(
			doc =>  vscode.window.showTextDocument(doc)
		)
		.then(() => vscode.commands.executeCommand('uiflow.openPreview'))
		.then(() => done(), reason => done);
	});

});