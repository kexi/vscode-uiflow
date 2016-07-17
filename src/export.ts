'use strict';

import vscode = require('vscode');
import fs = require('fs');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, Uri} from 'vscode';
import { MODE } from './mode';

const svg2png = require('svg2png');

interface Converter {
	(buffer: Buffer): Buffer;
}

interface CmdOptions {
	command: string;
	converter?: Converter;
	extension: string;
	format: string;
	name: string;
}

interface ResolveExportPath {
	(options?: vscode.InputBoxOptions): Thenable<any>;
}

let resolveExportPath: ResolveExportPath = vscode.window.showInputBox;

let cmds: {[key: string]: CmdOptions; } = {
	'svg':	{
		command: 'uiflow.exportSVG',
		name: 'SVG',
		extension: '.svg',
		format: CompileFormat.SVG
	},
	'png':	{
		command: 'uiflow.exportPNG',
		name: 'PNG',
		extension: '.png',
		format: CompileFormat.PNG,
		converter: buffer => svg2png.sync(buffer)
	},
};

export function activate(context: ExtensionContext) {
	for (let id in cmds) {
		let disposable = vscode.commands.registerCommand(cmds[id].command, uri => exportAs(uri, cmds[id].format));
		context.subscriptions.push(disposable);
	}
};

function exportAs(uri: Uri, format: string): Thenable<any> {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		} else {
			vscode.window.showWarningMessage('Open UiFlow document before export.');
			return Promise.reject('Open UiFlow document before export.');
		}
	}
	let cmd = cmds[format];

	let thenable = vscode.workspace.openTextDocument(uri)
	.then(doc => Compiler.compile(uri.path.toString(), doc.getText(), CompileFormat.SVG))
	.then(buffer => save(buffer, cmd.name, cmd.converter))
	.then(() => vscode.window.showInformationMessage(`Successfully Exported ${cmd.name}.`));
	return thenable;
}

function save(buffer: Buffer, name: string, converter: Converter): Thenable<void> {
	if (converter) {
		buffer = converter(buffer);
	}
	let options: vscode.InputBoxOptions = {
		prompt: `Enter Path to Export a ${name} File`,
		value: getUserHome() + path.sep
	};
	return resolveExportPath(options).then(exportPath => {
		return fs.writeFileSync(exportPath, buffer);
	});
}

export function setResovleExportPath(resolver: ResolveExportPath) {
	resolveExportPath = resolver;
}

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
