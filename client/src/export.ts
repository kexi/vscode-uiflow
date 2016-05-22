'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext} from 'vscode';
import { languageId } from './extension';

const svg2png = require('svg2png');

interface ExportType {
	command: string;
	callback: Callback;
}

interface Callback {
	(editor: vscode.TextEditor): void;
}

interface CallbackOption {
	converter?: (input: Buffer) => Buffer;
	extension: string;
	format: CompileFormat;
	name: string;
}

interface ResolveExportPath {
	(options?: vscode.InputBoxOptions): Thenable<any>;
}

let resolveExportPath: ResolveExportPath = vscode.window.showInputBox;

export function activate(context: ExtensionContext) {
	let cmds: Array<{command: string, callback: Callback}> = [
		{
			command: 'uiflow.exportPNG',
			callback: createCallback({
				name: 'PNG',
				extension: '.png',
				converter: (buffer) => svg2png.sync(buffer),
				format: CompileFormat.PNG
			})
		},
		{
			command: 'uiflow.exportSVG',
			callback: createCallback({
				name: 'SVG',
				extension: '.svg',
				format: CompileFormat.SVG
			})
		}
	];
	cmds.forEach(cmd => {
		let disposable = vscode.commands.registerTextEditorCommand(cmd.command, cmd.callback);
		context.subscriptions.push(disposable);
	});
};

function createCallback(option: CallbackOption): Callback {
	let callback = (editor: vscode.TextEditor) => {
		if (!checkLanguage(editor)) {
			return;
		}
		let inputDialogOptions: vscode.InputBoxOptions = {
			prompt: `Enter Path to Export a ${option.name} File`,
			value: getUserHome() + path.sep
		};
		let exportPath: string;
		return resolveExportPath(inputDialogOptions)
			.then(expPath => {
				exportPath = expPath;
				return Compiler.compile(
					editor.document.uri.toString(),
					editor.document.getText(),
					CompileFormat.SVG
				);
			})
			.then(buffer => {
				if (option.converter) {
					buffer = option.converter(buffer);
				}
				fs.writeFileSync(exportPath, buffer);
				return vscode.window.showInformationMessage(`Successfully Exported ${option.name} to '${exportPath}'`);
			})
			.then(() => {}, reason => vscode.window.showErrorMessage(reason));
	};
	return callback;
}

export function setResovleExportPath(resolver: ResolveExportPath) {
	resolveExportPath = resolver;
}

function checkLanguage(editor: vscode.TextEditor): boolean {
	if (editor.document.languageId === languageId) {
		return true;
	}
	vscode.window.showErrorMessage('Editor doesn\'t show a Uiflow Document.');
	return false;
}

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
