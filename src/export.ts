'use strict';

import vscode = require('vscode');
import fs = require('fs-extra');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, EventEmitter, InputBoxOptions, Event, TextDocument, TextDocumentContentProvider, Uri} from 'vscode';
import { MODE } from './mode';

const scheme = 'uiflow-export';
const commandOpenExport = 'uiflow.openExport';
const commandSaveImage = 'uiflow.saveImage';
const commandExportSVG = 'uiflow.exportSVG';
const commandExportJSON = 'uiflow.exportJSON';
const commandExportDOT = 'uiflow.exportDOT';

interface ResolveExportPath {
	(options?: InputBoxOptions): Thenable<any>;
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
	let d4 = vscode.commands.registerCommand(commandExportSVG, uri => exportAs(uri, CompileFormat.SVG));
	let d5 = vscode.commands.registerCommand(commandExportJSON, uri => exportAs(uri, CompileFormat.JSON));
	let d6 = vscode.commands.registerCommand(commandExportDOT, uri => exportAs(uri, CompileFormat.DOT));
	context.subscriptions.push(d1, d2, d3, d4, d5, d6);
}

export async function exportAs(uri: Uri, format: string): Promise<any> {
	let document: TextDocument;
	try {
		document = await resolveDocument(uri);
	} catch (_) {
		return;
	}
	let data = await Compiler.compile(document.uri.fsPath, document.getText(), format);
	let options: InputBoxOptions = {
		prompt: `Enter Path to Export a ${format.toUpperCase()} File`,
		value: getUserHome() + path.sep
	};
	let outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, data);
	vscode.window.showInformationMessage(`Successfully Exported ${format.toUpperCase()}.`);
}

export async function resolveDocument(uri): Promise<TextDocument> {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		} else {
			vscode.window.showWarningMessage('Open UiFlow document before export.');
			throw Error('Open UiFlow document before export.');
		}
	}
	let doc = await vscode.workspace.openTextDocument(uri);
	return doc;
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
	let options: InputBoxOptions = {
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

export class UiflowExportPngTextDocumentProvider implements TextDocumentContentProvider {
	private _onDidChange = new EventEmitter<Uri>();
	private _waiting: boolean;

	public constructor(private context: ExtensionContext) {
		this._waiting = false;
	}

	public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
		return vscode.workspace.openTextDocument(Uri.parse(uri.query)).then(doc => {
			return this.render(doc);
		});
	}

	public update(uri: Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
	}

	get onDidChange(): Event<Uri> {
		return this._onDidChange.event;
	}

	private getPath(basename: string): string {
		return this.context.extensionPath + '/' + basename;
	}


	private render(document: TextDocument): string | Thenable<string> {
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
