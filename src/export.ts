'use strict';

import vscode = require('vscode');
import fs = require('fs');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import { workspace, Disposable, ExtensionContext, EventEmitter, InputBoxOptions, Event, TextDocument, TextDocumentContentProvider, Uri} from 'vscode';
import { Base64 } from 'js-base64';

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
let ctx: ExtensionContext;

export function activate(context: ExtensionContext) {
	ctx = context;
	const d2 = vscode.commands.registerCommand(
		commandOpenExport, uri => openExport(uri));
	const d3 = vscode.commands.registerCommand(commandSaveImage, saveData);
	const d4 = vscode.commands.registerCommand(commandExportSVG, uri => exportAs(uri, CompileFormat.SVG));
	const d5 = vscode.commands.registerCommand(commandExportJSON, uri => exportAs(uri, CompileFormat.JSON));
	const d6 = vscode.commands.registerCommand(commandExportDOT, uri => exportAs(uri, CompileFormat.DOT));
	context.subscriptions.push(d2, d3, d4, d5, d6);
}

export async function exportAs(uri: Uri, format: string): Promise<any> {
	try {
		const document: TextDocument = await resolveDocument(uri);
		const data = await Compiler.compile(document.uri.fsPath, document.getText(), format);
	const options: InputBoxOptions = {
		prompt: `Enter Path to Export a ${format.toUpperCase()} File`,
		value: getUserHome() + path.sep
	};
	const outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, data);
	vscode.window.showInformationMessage(`Successfully Exported ${format.toUpperCase()}.`);
	} catch (_) {
		return;
	}
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
	const doc = await vscode.workspace.openTextDocument(uri);
	return doc;
}

export function setResovleExportPath(resolver: ResolveExportPath) {
	resolveExportPath = resolver;
}

function getUserHome() {
	return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

export async function saveData(url: string) {
	const b = url.split(',')[1];
	const options: InputBoxOptions = {
		prompt: `Enter Path to Export a PNG File`,
		value: getUserHome() + path.sep
	};
	const outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, new Buffer(b, 'base64'));
	vscode.window.showInformationMessage('Successfully Exported PNG.');
}

async function openExport(uri: Uri) {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
	}

	if (!(uri instanceof Uri)) {
		return;
	}

	const panel = vscode.window.createWebviewPanel(
		'uiflow.export',
		'Export: ' + path.basename(uri.fsPath),
		vscode.ViewColumn.One,
		{
			enableCommandUris: true,
			enableScripts: true,
			localResourceRoots: [
				Uri.file(path.join(ctx.extensionPath, 'media'))
			]
		}
	);

	const doc = await vscode.workspace.openTextDocument(uri);
	const svg = await Compiler.compile(path.basename(uri.fsPath), doc.getText(), 'svg');

	panel.webview.html = createHtml(svg);

	return panel;
}

function mediaPath(p) {
	return vscode.Uri.file(path.join(ctx.extensionPath, p)).with({scheme: 'vscode-resource'});
}
function createHtml(svg: Buffer): string {
	const html = `<!DOCTYPE html>
	<html>
	<head>
	<link href="${mediaPath('media/core.css')}" rel="stylesheet" type="text/css" media="all">
	<link href="${mediaPath('media/button.css')}" rel="stylesheet" type="text/css" media="all">
	<script src="${mediaPath('media/jquery-3.3.1.min.js')}"></script>
	<script src="${mediaPath('media/index.js')}"></script>
	</head>
	<body>
	<h1>Export Uiflow Diagram</h1>
	<a id="export" href="#" class="btn">Export PNG</a>
	<h1>Preview</h1>
	<div id="img_cnt">
	<h2>img</h2>
	<img id="img" src="data:image/svg+xml;base64,${Base64.encode(svg.toString().replace(/\u0008/g, ''))}">
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
	return html;
}