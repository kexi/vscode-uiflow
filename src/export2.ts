'use strict';

import vscode = require('vscode');
import fs = require('fs-extra');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, Uri, EventEmitter} from 'vscode';
import { MODE } from './mode';

const commandOpenExport = 'uiflow.openExport';
const commandOpenSource = 'uiflow.openSource';
const commandSaveImage = 'uiflow.saveImage';
const scheme = 'uiflow';

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

export function activate(context: ExtensionContext) {
	let provider = new UiflowExportPngTextDocumentProvider(context);
	vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
		if (event.document === vscode.window.activeTextEditor.document) {
			provider.update(getUiflowUri(event.document.uri));
		}
	});
	let registration = workspace.registerTextDocumentContentProvider(scheme, provider);
	let d1 = vscode.commands.registerCommand(
		commandOpenExport, uri => openPreview(uri), vscode.ViewColumn.Two);
	let d2 = vscode.commands.registerCommand(commandSaveImage, saveData);
	context.subscriptions.push(d1, d2, registration);
}

function getUiflowUri(uri: any): Uri {
	return uri.with({
		scheme: scheme,
		path: uri.path + '.export',
		query: uri.toString()
	});
}

function openPreview(uri: Uri) {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
	}

	if (!(uri instanceof Uri)) {
		if (!vscode.window.activeTextEditor) {
			return vscode.commands.executeCommand(commandOpenSource);
		}
		return;
	}
	return vscode.commands.executeCommand('vscode.previewHtml', getUiflowUri(uri), vscode.ViewColumn.Two);
}

export async function saveData(url: string) {
	let b = url.split(',')[1];
	let fp = '/temp/hoge.png';
	fs.writeFileSync(fp, new Buffer(b, 'base64'));
	vscode.window.showInformationMessage('exported');
}