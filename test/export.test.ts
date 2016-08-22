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
			.then(editor => vscode.commands.executeCommand(testCase.command))
			.then(() => {
				let buffer = fs.readFileSync(testCase.outputPath);
				testCase.fileCheck(buffer)
				.then(() => done(), reason => done(reason));
			});
		});
	});

	test('Export SVG', done => {
		let inputPath = path.join(fixturePath, 'ok.uif');
		let outputPath = path.join(fixturePath, 'ok.uif.svg');
		setResovleExportPath(() => Promise.resolve(outputPath));
		vscode.workspace.openTextDocument(inputPath)
		.then(() => vscode.commands.executeCommand('uiflow.exportSVG'))
		.then(() => {
			let buffer = fs.readFileSync(outputPath);
			let svg = String(buffer);
			if (svg.includes('</svg>')) {
				return Promise.resolve();
			}
			return Promise.reject('SVG file doesn\'t contain </svg>');
		})
		.then(() => done(), reason => done(reason));
	});

	test('Open Export', done => {
		let filePath = path.join(fixturePath, 'ok.uif');
		vscode.workspace.openTextDocument(filePath)
		.then(doc => vscode.commands.executeCommand('uiflow.openExport'))
		.then(() => done(), reason => done(reason));
	});

	test('Save Image', done => {
		let filePath = path.join(fixturePath, 'ok.uif.png');
		let url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8////fwAKAAP+j4hsjgAAAABJRU5ErkJggg==';
		vscode.commands.executeCommand('uiflow.saveImage', url)
		.then(() => {
				let buffer = fs.readFileSync(filePath);
				let actual = buffer.slice(0, 8);
				let expected = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
				assert.ok(actual.equals(expected), 'PNG file signature not found.');
				return Promise.resolve();
			}
		)
		.then(() => done(), reason => done(reason));
	});

});