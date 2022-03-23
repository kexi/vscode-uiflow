'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import fs = require('fs');
import os = require('os');

suite('UiFlow Extension Tests', () => {
	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'suite', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(path.join(fixtureSourcePath, 'ok.uif'), path.join(fixturePath, 'ok.uif'));
	});

	test('Open Preview Side By Side', async () => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'ok.uif'));
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc);
		assert.doesNotThrow(async () => {
			await vscode.commands.executeCommand('uiflow.openPreviewSideBySide');
		});
	});

	test('Open Preview In Place', async () => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'ok.uif'));
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc);
		assert.doesNotThrow(async () => {
			await vscode.commands.executeCommand('uiflow.openPreviewInPlace');
		});
	});
});