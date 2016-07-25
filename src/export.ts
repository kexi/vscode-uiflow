'use strict';

import vscode = require('vscode');
import fs = require('fs-extra');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, Uri} from 'vscode';
import { MODE } from './mode';
import tmp = require('tmp');

const exec = require('child_process').exec;
const phantomjs = require('phantomjs-prebuilt');
const svgexport = require('svgexport');

interface Processor {
	(tmpobj: tmp.SynchrounousResult, path: string): Thenable<void>;
}

interface CmdOptions {
	command: string;
	processor: Processor;
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
		format: CompileFormat.SVG,
		processor: copy
	},
	'png':	{
		command: 'uiflow.exportPNG',
		name: 'PNG',
		extension: '.png',
		format: CompileFormat.PNG,
		processor: png
	},
};

function copy(tmpobj: tmp.SynchrounousResult, newPath: string): Thenable<void> {
	fs.copySync(tmpobj.name, newPath);
	return;
}

function png(tmpobj: tmp.SynchrounousResult, newPath: string): Thenable<void> {
	let thenable = new Promise<void>((ok, ng) => {
		svgexport.render({input: tmpobj.name, output: newPath}, err => {
			if (err) {
				return ng(err);
			}
			ok();
		});
	});
	return thenable;
}

export function activate(context: ExtensionContext) {
	rebuild(context);
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
	.then(buffer => {
		let tmpobj = tmp.fileSync({ 'postfix': '.svg' });
		fs.writeFileSync(tmpobj.name, buffer);
		return save(tmpobj, cmd.name, cmd.processor);
	})
	.then(() => {
		vscode.window.showInformationMessage(`Successfully Exported ${cmd.name}.`);
		return;
	});
	return thenable;
}

function save(tmpobj: tmp.SynchrounousResult, name: string, processor: Processor): Thenable<void> {
	let options: vscode.InputBoxOptions = {
		prompt: `Enter Path to Export a ${name} File`,
		value: getUserHome() + path.sep
	};
	return resolveExportPath(options).then(newPath => processor(tmpobj, newPath));
}

export function setResovleExportPath(resolver: ResolveExportPath) {
	resolveExportPath = resolver;
}

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function rebuild(context: ExtensionContext): Thenable<void> {
	let thenable = new Promise<void>((ok, ng) => {
		exec('npm rebuild phantomjs-prebuilt', {cwd: context.extensionPath}, (err) => {
			if (err) {
				return ng(err);
			}
			ok();
		});
	});
	return thenable;
}
