'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as outline from '../src/outline';

suite('UiFlow Outline Tests', () => {

	let fixturePath = path.join(__dirname, '..', '..', '__test', 'fixtures');
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fs.removeSync(fixturePath);
		fs.mkdirsSync(fixturePath);
		fs.copySync(path.join(fixtureSourcePath, 'outline.uif'), path.join(fixturePath, 'outline.uif'));
	});

	let expected: {name: string, lines: number}[] = [
		{name: 'seg1', lines: 0},
		{name: 'seg2', lines: 5},
		{name: 'seg3', lines: 9}
	];

	test('Test codeToSections', done => {
		let code = fs.readFileSync(path.join(fixturePath, 'outline.uif'), 'utf8');
		outline.codeToSections(code).then(actual => {
			assert.equal(actual.length, expected.length, `Section length must be ${expected.length}.`);
			actual.forEach((act, i) => {
				let ex = expected[i];
				assert.equal(act.name, ex.name, `Section name must be ${ex.name}.`);
				assert.equal(act.lines, ex.lines, `Section lines must be ${ex.lines}.`);
			});
		}).then(() => done(), reason => done(reason));
	});

	test('provideDocumentSymbols#UiflowDocumentSymbolProvider', done => {
		let uri = vscode.Uri.file(path.join(fixturePath, 'outline.uif'));
		vscode.workspace.openTextDocument(uri).then(doc => {
			let instance = new outline.UiflowDocumentSymbolProvider();
			instance.provideDocumentSymbols(doc, null).then(info => {
				assert.equal(info.length, expected.length, `SymbolInformation length must be ${expected.length}.`);
				info.forEach((inf, i) => {
					let ex = expected[i];
					assert.equal(inf.name, ex.name, `SymbolInformation name must be ${ex.name}.`);
					assert.equal(inf.location.range.start.line, ex.lines, 'SymbolInformation location.range.start.line must be ${ex.lines}.');
				});
			});
		}).then(() => done(), reason => done(reason));
	});
});