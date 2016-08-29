'use strict';

import vscode = require('vscode');
import fs = require('fs-extra');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, EventEmitter, Uri, Event} from 'vscode';
import { MODE } from './mode';

const scheme = 'uiflow-export';
const commandOpenExport = 'uiflow.openExport';
const commandSaveImage = 'uiflow.saveImage';
const commandExportSVG = 'uiflow.exportSVG';

interface ResolveExportPath {
	(options?: vscode.InputBoxOptions): Thenable<any>;
}

let resolveExportPath: ResolveExportPath = vscode.window.showInputBox;

export function activate(context: ExtensionContext) {
	let provider = new UiflowExportPngTextDocumentProvider(context);
	vscode.workspace.onDidChangeTextDocument(e => {
		provider.update(getExportUri(e.document.uri));
	});
	let d1 = workspace.registerTextDocumentContentProvider(scheme, provider);
	let d2 = vscode.commands.registerCommand(
		commandOpenExport, uri => openExport(uri));
	let d3 = vscode.commands.registerCommand(commandSaveImage, saveData);
	let d4 = vscode.commands.registerCommand(commandExportSVG, uri => exportSVG(uri));
	context.subscriptions.push(d1, d2, d3, d4);
};

async function exportSVG(uri: Uri): Promise<any> {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		} else {
			vscode.window.showWarningMessage('Open UiFlow document before export.');
			return Promise.reject('Open UiFlow document before export.');
		}
	}
	let doc = await vscode.workspace.openTextDocument(uri);
	let svg = await Compiler.compile(uri.path.toString(), doc.getText(), CompileFormat.SVG);
	let options: vscode.InputBoxOptions = {
		prompt: `Enter Path to Export a SVG File`,
		value: getUserHome() + path.sep
	};
	let outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, svg);
	vscode.window.showInformationMessage(`Successfully Exported SVG.`);
}

export function setResovleExportPath(resolver: ResolveExportPath) {
	resolveExportPath = resolver;
}

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getExportUri(uri: any): Uri {
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
	let outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, new Buffer(b, 'base64'));
	vscode.window.showInformationMessage('Successfully Exported PNG.');
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
	return vscode.commands.executeCommand('vscode.previewHtml', getExportUri(uri));
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

	get onDidChange(): Event<Uri> {
		return this._onDidChange.event;
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
<script src="${this.getPath('node_modules/jquery/dist/jquery.js')}"></script>
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
