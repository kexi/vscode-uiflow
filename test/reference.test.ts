'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import fs = require('fs');
import os = require('os');
import { UiflowReferenceProvider } from '../src/reference';

suite('UiFlow Reference Tests', () => {
	let fixturePath;
	let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');

	suiteSetup(() => {
		fixturePath = fs.mkdtempSync(path.join(
			os.tmpdir(),
			'fixtures'
		));
		fs.copyFileSync(
			path.join(fixtureSourcePath, 'reference.uif'),
			path.join(fixturePath, 'reference.uif')
		);
	});

	test('Test provideReferences#UiflowReferenceProvider', done => {
		vscode.workspace.openTextDocument(path.join(fixturePath, 'reference.uif'))
		.then(doc => {
			let provider = new UiflowReferenceProvider();
			let position = new vscode.Position(6, 1);
			return provider.provideReferences(doc, position, null, null)
			.then((locations: vscode.Location[]) => {
				let expected: vscode.Range[] = [
					new vscode.Range(10, 4, 10, 8),
					new vscode.Range(16, 4, 16, 8)
				];
				expected.forEach((range, i) => {
					assert.ok(range.isEqual(locations[i].range), `Range should be equal.`);
				});
			});
		}, reason => assert.ok(false, `Error in openTextDocument ${reason}.`))
		.then(() => done(), reason => done(reason));
	});
});