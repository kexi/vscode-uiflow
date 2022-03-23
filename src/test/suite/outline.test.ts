'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as outline from '../../outline';
import fs = require('fs');
import os = require('os');

suite('UiFlow Outline Tests', () => {

	let fixturePath: string;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(path.join(fixtureSourcePath, 'outline.uif'), path.join(fixturePath, 'outline.uif'));
	});

	let expected: {name: string, lines: number}[] = [
		{name: 'seg1', lines: 0},
		{name: 'seg2', lines: 5},
		{name: 'seg3', lines: 9}
	];

	test('Test codeToSections', async () => {
		const code = fs.readFileSync(path.join(fixturePath, 'outline.uif'), 'utf8');
		const actual = await outline.codeToSections(code);
		assert.equal(actual.length, expected.length, `Section length must be ${expected.length}.`);
		actual.forEach((act, i) => {
			const ex = expected[i];
			assert.equal(act.name, ex.name, `Section name must be ${ex.name}.`);
			assert.equal(act.lines, ex.lines, `Section lines must be ${ex.lines}.`);
		});
	});

	test('provideDocumentSymbols#UiflowDocumentSymbolProvider', async () => {
		const uri = vscode.Uri.file(path.join(fixturePath, 'outline.uif'));
		const doc = await vscode.workspace.openTextDocument(uri);
		const instance = new outline.UiflowDocumentSymbolProvider();
		const info = await instance.provideDocumentSymbols(doc, outline.documentSymbolCancellationToken);
		assert.equal(info.length, expected.length, `SymbolInformation length must be ${expected.length}.`);
		info.forEach((inf, i) => {
			let ex = expected[i];
			assert.equal(inf.name, ex.name, `SymbolInformation name must be ${ex.name}.`);
			assert.equal(inf.location.range.start.line, ex.lines, 'SymbolInformation location.range.start.line must be ${ex.lines}.');
		});
	});
});