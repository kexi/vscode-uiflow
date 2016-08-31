'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as extension from '../src/extension';
import * as fs from 'fs-extra';
import { setResovleExportPath } from '../src/export';

suite('UiFlow Export Tests', () => {
	let fixturePath = path.join(__dirname, '..', '..', '__test', 'fixtures');
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fs.removeSync(fixturePath);
		fs.mkdirsSync(fixturePath);
		fs.copySync(path.join(fixtureSourcePath, 'ok.uif'), path.join(fixturePath, 'ok.uif'));
	});

	test('Export SVG', async () => {
		let inputPath = path.join(fixturePath, 'ok.uif');
		let outputPath = path.join(fixturePath, 'ok.uif.svg');
		setResovleExportPath(() => {return Promise.resolve(outputPath); });
		let doc = await vscode.workspace.openTextDocument(inputPath);
		await vscode.window.showTextDocument(doc);
		await vscode.commands.executeCommand('uiflow.exportSVG');
		let buffer = fs.readFileSync(outputPath);
		let svg = String(buffer);
		if (!svg.includes('</svg>')) {
			return Promise.reject('SVG file doesn\'t contain </svg>');
		}
	});

	test('Export JSON', async () => {
		let inputPath = path.join(fixturePath, 'ok.uif');
		let outputPath = path.join(fixturePath, 'ok.uif.json');
		setResovleExportPath(() => {return Promise.resolve(outputPath); });
		let doc = await vscode.workspace.openTextDocument(inputPath);
		await vscode.window.showTextDocument(doc);
		await vscode.commands.executeCommand('uiflow.exportJSON');
		let buffer = fs.readFileSync(outputPath);
		let json = String(buffer);
		JSON.parse(json);
	});

	test('Export DOT', async () => {
		let inputPath = path.join(fixturePath, 'ok.uif');
		let outputPath = path.join(fixturePath, 'ok.uif.dot');
		setResovleExportPath(() => {return Promise.resolve(outputPath); });
		let doc = await vscode.workspace.openTextDocument(inputPath);
		await vscode.window.showTextDocument(doc);
		await vscode.commands.executeCommand('uiflow.exportDOT');
		let buffer = fs.readFileSync(outputPath);
		let dot = String(buffer);
		if (!dot.match(/^digraph/)) {
			return Promise.reject(`DOT file doesn't start width 'digraph'.`);
		}
		if (!dot.match(/\}$/m)) {
			return Promise.reject(`DOT file doesn't end width '}'.`);
		}
	});

	test('Open Export', done => {
		let filePath = path.join(fixturePath, 'ok.uif');
		vscode.workspace.openTextDocument(filePath)
		.then(doc => vscode.commands.executeCommand('uiflow.openExport'))
		.then(() => done(), reason => done(reason));
	});

	test('Save Image', done => {
		let outputPath = path.join(fixturePath, 'ok.uif.png');
		setResovleExportPath(() => {return Promise.resolve(outputPath); });
		let url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8////fwAKAAP+j4hsjgAAAABJRU5ErkJggg==';
		vscode.commands.executeCommand('uiflow.saveImage', url)
		.then(() => {
				let buffer = fs.readFileSync(outputPath);
				let actual = buffer.slice(0, 8);
				let expected = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
				assert.ok(actual.equals(expected), 'PNG file signature not found.');
				return Promise.resolve();
			}
		)
		.then(() => done(), reason => done(reason));
	});

});