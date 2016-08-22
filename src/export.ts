'use strict';

import vscode = require('vscode');
import fs = require('fs-extra');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, EventEmitter, Uri} from 'vscode';
import { MODE } from './mode';
import tmp = require('tmp');

const phantomjs = require('phantomjs-prebuilt');
const svgexport = require('svgexport');
const exec = require('sync-exec');
const scheme = 'uiflow-export';
const commandOpenExport = 'uiflow.openExport';
const commandSaveImage = 'uiflow.saveImage';

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
	if (!fs.existsSync(phantomjs.path)) {
		rebuild(context);
	}
	for (let id in cmds) {
		let disposable = vscode.commands.registerCommand(cmds[id].command, uri => exportAs(uri, cmds[id].format));
		context.subscriptions.push(disposable);
	}
	let provider = new UiflowExportPngTextDocumentProvider(context);
	let d1 = workspace.registerTextDocumentContentProvider(scheme, provider);
	let d2 = vscode.commands.registerCommand(
		commandOpenExport, uri => openExport(uri), vscode.ViewColumn.Two);
	let d3 = vscode.commands.registerCommand(commandSaveImage, saveData);
	context.subscriptions.push(d1, d2, d3);
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
	let result = exec('npm rebuild', {cwd: context.extensionPath});
	process.env.PHANTOMJS_PLATFORM = process.platform;
	process.env.PHANTOMJS_ARCH = process.arch;
	phantomjs.path = process.platform === 'win32' ?
		path.join(path.dirname(phantomjs.path), 'phantomjs.exe') :
		path.join(path.dirname(phantomjs.path), 'phantom', 'bin', 'phantomjs');
	return Promise.resolve();
}

function getUiflowUri(uri: any): Uri {
	return uri.with({
		scheme: scheme,
		path: uri.path + '.rendered',
		query: uri.toString()
	});
}

export async function saveData(url: string) {
	let b = url.split(',')[1];
	let options: vscode.InputBoxOptions = {
		prompt: `Enter Path to Export a PNG File`,
		value: getUserHome() + path.sep
	};
	let fp = await resolveExportPath(options);
	fs.writeFileSync(fp, new Buffer(b, 'base64'));
	vscode.window.showInformationMessage('Successfully Exported PNG.');
}

export class UiflowExportPngTextDocumentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new EventEmitter<Uri>();
	public constructor(private context: ExtensionContext) {
	}

	public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
		return vscode.workspace.openTextDocument(Uri.parse(uri.query)).then(doc => {
			return this.render(doc);
		});
	}

	public update(uri: Uri) {
		this._onDidChange.fire(uri);
	}

	private getPath(basename: string): string {
		return this.context.extensionPath + '/' + basename;
	}

	private render(document: vscode.TextDocument): string | Thenable<string> {
		return Compiler.compile(document.uri.fsPath, document.getText(), CompileFormat.SVG)
		.then(svg => {
			return `<!DOCTYPE html>
<html>
<head>
<link href="${this.getPath('media/core.css')}" rel="stylesheet" type="text/css" media="all">
<link href="${this.getPath('media/button.css')}" rel="stylesheet" type="text/css" media="all">
<script src="${this.getPath('bower_components/jquery/dist/jquery.js')}"></script>
<script src="${this.getPath('media/index.js')}"></script>
</head>
<body>
<h1>Export Uiflow Diagram</h1>
<a id="export" href="#" class="btn">Export PNG</a>
<h1>Preview</h1>
<div id="img_cnt">
<h2>img</h2>
<img id="img" src="data:image/svg+xml,${encodeURIComponent(svg.toString())}" alt="preview" />
</div>
<div id="svg_cnt">
<h2>svg</h2>
${svg}
</div>
<div id="canvas_cnt">
<h2>canvas</h2>
<canvas></canvas>
</div>
</body>
</html>`;
		});
	}
}

function openExport(uri: Uri) {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
	}

	if (!(uri instanceof Uri)) {
		return;
	}
	return vscode.commands.executeCommand('vscode.previewHtml', getUiflowUri(uri));
}
