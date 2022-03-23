'use strict';

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as extension from '../../extension';
import fs = require('fs');
import os = require('os');
import { setResovleExportPath, saveData } from '../../export';

suite('UiFlow Export Tests', () => {
	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(
			path.join(fixtureSourcePath, 'ok.uif'),
			path.join(fixturePath, 'ok.uif'));
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

	test('Open Export', async () => {
		let filePath = path.join(fixturePath, 'ok.uif');
		const doc = await vscode.workspace.openTextDocument(filePath);
		assert.doesNotThrow(async () => {
			await vscode.commands.executeCommand('uiflow.openExport');
		});
	});

	test('Save Image', async () => {
		const outputPath = path.join(fixturePath, 'ok.uif.png');
		setResovleExportPath(() => {return Promise.resolve(outputPath); });
		const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8////fwAKAAP+j4hsjgAAAABJRU5ErkJggg==';
		await saveData(url);
		const buffer = fs.readFileSync(outputPath);
		const actual = buffer.slice(0, 8);
		const expected = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
		assert.ok(actual.equals(expected), 'PNG file signature not found.');
	});

});