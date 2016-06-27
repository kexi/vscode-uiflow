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

	interface ExportFileCheck {
		(buffer: Buffer): Thenable<any>;
	};

	interface ExportTestCase {
		name: string;
		command: string;
		inputPath: string;
		outputPath: string;
		fileCheck: ExportFileCheck;
	};

	let exportTestCases: ExportTestCase[] = [{
		name: 'PNG',
		command: 'uiflow.exportPNG',
		inputPath: path.join(fixturePath, 'ok.uif'),
		outputPath: path.join(fixturePath, 'ok.uif.png'),
		fileCheck: buffer => {
			let actual = buffer.slice(0, 8);
			let expected = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
			assert.ok(actual.equals(expected), 'PNG file signature not found.');
			return Promise.resolve();
		}
	}, {
		name: 'SVG',
		command: 'uiflow.exportSVG',
		inputPath: path.join(fixturePath, 'ok.uif'),
		outputPath: path.join(fixturePath, 'ok.uif.svg'),
		fileCheck: buffer => {
			let svg = String(buffer);
			if (svg.includes('</svg>')) {
				return Promise.resolve();
			}
			return Promise.reject('SVG file doesn\'t contain </svg>');
		}
	}];

	exportTestCases.map(testCase => {
		test(`Export ${testCase.name}`, done => {
			let uri = vscode.Uri.file(testCase.inputPath);
			setResovleExportPath(() => { return Promise.resolve(testCase.outputPath); });
			vscode.workspace.openTextDocument(uri)
			.then(doc => {
				assert.equal(doc.languageId, 'uiflow');
				return vscode.window.showTextDocument(doc);
			})
			.then(editor => {
				vscode.commands.executeCommand(testCase.command);
				setTimeout(() => {
					let buffer = fs.readFileSync(testCase.outputPath);
					testCase.fileCheck(buffer).then(() => done(), reason => {
						assert.ok(false, `Error: ${reason}`);
						done();
					});
				}, 500);
			});
		});
	});

});