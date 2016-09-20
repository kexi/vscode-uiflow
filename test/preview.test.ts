'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as extension from '../src/extension';
import * as fs from 'fs-extra';
import { setResovleExportPath } from '../src/export';
import * as tmp from 'tmp';

suite('UiFlow Extension Tests', () => {
	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		let dir = tmp.dirSync();
		fixturePath = dir.name;
		fs.ensureDirSync(dir.name);
		fs.copySync(path.join(fixtureSourcePath, 'ok.uif'), path.join(fixturePath, 'ok.uif'));
	});

	test('Open Preview Side By Side', async () => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'ok.uif'));
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc);
		assert.ok(await vscode.commands.executeCommand('uiflow.openPreviewSideBySide'));
	});

	test('Open Preview In Place', async () => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'ok.uif'));
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc);
		assert.ok(await vscode.commands.executeCommand('uiflow.openPreviewInPlace'));
	});
});