'use strict';

import fs = require('fs');
import path = require('path');
import { Compiler, CompileFormat } from './compiler';
import * as vscode from 'vscode';
import { Base64 } from 'js-base64';

const commandOpenExport = 'uiflow.openExport';
const commandExportSVG = 'uiflow.exportSVG';
const commandExportJSON = 'uiflow.exportJSON';
const commandExportDOT = 'uiflow.exportDOT';

interface ResolveExportPath {
	(options?: vscode.InputBoxOptions): Thenable<any>;
}

let resolveExportPath: ResolveExportPath = vscode.window.showInputBox;
let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	ctx = context;
	const d2 = vscode.commands.registerCommand(
		commandOpenExport, uri => openExport(uri));
	const d4 = vscode.commands.registerCommand(commandExportSVG, uri => exportAs(uri, CompileFormat.SVG));
	const d5 = vscode.commands.registerCommand(commandExportJSON, uri => exportAs(uri, CompileFormat.JSON));
	const d6 = vscode.commands.registerCommand(commandExportDOT, uri => exportAs(uri, CompileFormat.DOT));
	context.subscriptions.push(d2, d4, d5, d6);
}

export async function exportAs(uri: vscode.Uri, format: string): Promise<any> {
	try {
		const document: vscode.TextDocument = await resolveDocument(uri);
		const compiler = new Compiler();
		const data = await compiler.compile(document.uri.fsPath, document.getText(), format);
	const options: vscode.InputBoxOptions = {
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

export async function resolveDocument(uri: any): Promise<vscode.TextDocument> {
	if (!(uri instanceof vscode.Uri)) {
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
	const options: vscode.InputBoxOptions = {
		prompt: `Enter Path to Export a PNG File`,
		value: getUserHome() + path.sep
	};
	const outputPath = await resolveExportPath(options);
	fs.writeFileSync(outputPath, new Buffer(b, 'base64'));
	vscode.window.showInformationMessage('Successfully Exported PNG.');
}

async function openExport(uri: vscode.Uri) {
	if (!(uri instanceof vscode.Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
	}

	if (!(uri instanceof vscode.Uri)) {
		return;
	}

	const panel = vscode.window.createWebviewPanel(
		'uiflow.export',
		'Export: ' + path.basename(uri.fsPath),
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(ctx.extensionPath, 'media'))
			]
		}
	);

	panel.webview.onDidReceiveMessage(msg => {
		switch (msg.command) {
			case 'save-png':
				saveData(msg.url);
		}
	});

	const doc = await vscode.workspace.openTextDocument(uri);
	const compiler = new Compiler();
	const dot = await compiler.compile(path.basename(uri.fsPath), doc.getText(), 'dot');

	panel.webview.html = createHtml(dot);

	return panel;
}

function mediaPath(p: any) {
	return vscode.Uri.file(path.join(ctx.extensionPath, 'media', p)).with({scheme: 'vscode-resource'});
}

function createHtml(dot: Buffer): string {
	const html = `<!DOCTYPE html>
	<html>
		<head>
			<link href="${mediaPath('core.css')}" rel="stylesheet" type="text/css" media="all">
			<link href="${mediaPath('button.css')}" rel="stylesheet" type="text/css" media="all">
			<script src="${mediaPath('d3.v5.min.js')}"></script>
		<script src="${mediaPath('wasm.min.js')}"></script>
		<script src="${mediaPath('d3-graphviz.js')}"></script>
		<script src="${mediaPath('jquery-3.3.1.min.js')}"></script>
			<script src="${mediaPath('export.js')}"></script>
		</head>
	<body>
		
		<h1>Export Uiflow Diagram</h1>
		<a id="export" href="#" class="btn">Export PNG</a>
		<h1>Preview</h1>
		<div id="graph"></div>
		<div id="img_cnt">
			<h2>img</h2>
			<img id="img" src="">
			</div>
		<div id="canvas_cnt">
			<h2>canvas</h2>
			<canvas id="canva"></canvas>
		</div>
		<script>
					d3.select("#graph").graphviz().renderDot(\`${dot}\`).on('end', function() {
						const imgstart = 'data:image/svg+xml;base64,';
						const vscode = acquireVsCodeApi();
						let cnv = $('#canva'), img = $('#img'), svg = $('#graph');
						let svgCode = svg.html();
						let imgSrc = imgstart + btoa(unescape(encodeURIComponent(svgCode.toString().replace(/\u0008/g, ''))));
						img.width = '400px';
						img.height = '400px';
						img.src = imgSrc;
						let w = svg.naturalWidth, h = svg.naturalHeight;
						cnv.attr({width: w, height: h});
						let ctx = cnv[0].getContext('2d');
						ctx.fillStyle ='#fff';
						ctx.fillRect(0, 0, w, h);
						ctx.drawImage(img, 0, 0, w, h);
					});
					</script>
		</body>
	</html>`;
	return html;
}