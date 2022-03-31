'use strict';

import path = require('path');
import vscode = require('vscode');
import { TextDocumentContentProvider, Event, EventEmitter, ExtensionContext, Uri, TextDocumentChangeEvent, ViewColumn, window, workspace } from 'vscode';
import { CompileFormat, Compiler } from './compiler';
import { checkUiFlow } from './util';
import * as parser from './parser';

const commandOpenPreview = 'uiflow.openPreviewSideBySide';
const commandOpenPreviewInPlace = 'uiflow.openPreviewInPlace';
const commandOpenSource = 'uiflow.openSource';

let ctx: vscode.ExtensionContext;

// @todo fix
export function escapeDot(source: string) {
    return String(source).replace(/[\\]/g, '\\\\');
}

export function activate(context: ExtensionContext) {
	ctx = context;
	const manager = new UiflowPreviewManager();
	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor|undefined) => {
		if (!editor) return
		if (!checkUiFlow(editor.document)) return;
		if (!vscode.workspace.getConfiguration('uiflow').get('enableAutoPreview')) return;
		if (vscode.window.activeTextEditor) {
			if (editor.document === vscode.window.activeTextEditor.document) {
				manager.createOrShow(editor.document.uri);
			}
		}
	});
	const d1 = vscode.commands.registerCommand(
		commandOpenPreview, uri => {
			if (!(uri instanceof Uri)) {
				uri = vscode?.window?.activeTextEditor?.document.uri;
			}
			if (!uri) {
				return;
			}
			manager.createOrShow(uri);
		});
	const d2 = vscode.commands.registerCommand(
		commandOpenPreviewInPlace, uri => {
			if (!(uri instanceof Uri)) {
				uri = vscode?.window?.activeTextEditor?.document.uri;
			}
			if (!uri) {
				return;
			}
			manager.createOrShow(uri, false);
		});
	const d3 = vscode.commands.registerCommand(commandOpenSource, e => {
		manager.showDocument();
	});
	context.subscriptions.push(d1, d2, d3);
}

function getViewColumn(sideBySide: boolean): ViewColumn|undefined {
	const active = vscode.window.activeTextEditor;
	if (!active) {
		return ViewColumn.One;
	}

	if (!sideBySide) {
		return active.viewColumn;
	}

	return active?.viewColumn ? active.viewColumn + 1 : undefined;
}

class UiflowPreviewManager {
	public static readonly contextKey = 'uiflowPreviewFocus';
	private readonly previews: UiflowPreview[] = [];
	private activePreview: UiflowPreview | undefined;
	public createOrShow(resource: vscode.Uri, sideBySide: boolean = true) {
		const existing = this.previews.find(p => p.resource.fsPath === resource.fsPath);
		if (existing) {
			existing.reveal();
			return;
		}

		const preview = UiflowPreview.create(resource, sideBySide);
		preview.onDidChangeViewState(e => {
			this.activePreview = e.webviewPanel.active ? preview : undefined;
			this.setPreviewActiveContext(e.webviewPanel.active);
		});

		preview.onDispose(() => {
			const existing = this.previews.indexOf(preview);
			if (existing === -1) return;
			this.previews.splice(existing, 1);
			if (this.activePreview === preview) {
				this.activePreview = undefined;
				this.setPreviewActiveContext(false);
			}
		});
		this.previews.push(preview);
		this.activePreview = preview;
		this.setPreviewActiveContext(true);
	}

	private setPreviewActiveContext(value: boolean) {
		vscode.commands.executeCommand('setContext', UiflowPreviewManager.contextKey, value);
	}

	public async showDocument(): Promise<vscode.TextEditor|undefined> {
		if (!this.activePreview) return;
		return vscode.window.showTextDocument(
			this.activePreview.resource,
			{viewColumn: ViewColumn.One}
		);
	}
}

class UiflowPreview {
	public static readonly viewType = 'uiflow.preview';
	private waiting: boolean = false;
	private readonly onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this.onDidChangeViewStateEmitter.event;
	private readonly onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this.onDisposeEmitter.event;

	constructor(public readonly resource: vscode.Uri, private panel: vscode.WebviewPanel) {
		vscode.workspace.onDidChangeTextDocument(e => {
			this.update(e.document.uri);
		});

		this.panel.onDidChangeViewState(e => {
			this.onDidChangeViewStateEmitter.fire(e);
		});

		this.panel.onDidDispose(e => {
			this.onDisposeEmitter.fire();
		});

		this.panel.webview.onDidReceiveMessage(async (e) => {
			var editor = vscode.window.activeTextEditor;

			if (!editor) {
				editor = await vscode.window.showTextDocument(this.resource, {
					viewColumn: ViewColumn.One
				});

				
			}

			switch (e.command) {
				case 'page-click':
					const ast = parser.parse(editor.document.getText());
					const section = ast.find(v => v.label === 'section' && v.text === e.text);
					if (!section) {
						return;
					}
					const line = section.start.line;
					const position: vscode.Position = new vscode.Position(line - 1, 0);
					editor.selection = new vscode.Selection(position, position);
					editor.revealRange(new vscode.Range(position, position));
					break;
				case 'end-click':
					editor.edit(edit => {
						if (editor) {
							const position: vscode.Position = new vscode.Position(editor.document.lineCount, 0);
							const eol = editor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
							edit.insert(position, [eol, '[', e.text, ']', eol].join(''));
							editor.selection = new vscode.Selection(position, position);
							editor.revealRange(new vscode.Range(position, position));
						}
					});
					break;
			}
		});
	}

	public static create(resource: vscode.Uri, sideBySide: boolean = true): UiflowPreview {
		var viewColumn = getViewColumn(sideBySide);
		if (!viewColumn) {viewColumn = 1;}
		const panel = vscode.window.createWebviewPanel(
			UiflowPreview.viewType,
			'Preview: ' + path.basename(resource.fsPath),
			{
				viewColumn: viewColumn,
				preserveFocus: false
			},
			{
				enableScripts: true,
				localResourceRoots: [
					Uri.file(path.join(ctx.extensionPath, 'media'))
				]
			}
			);

			const preview = new UiflowPreview(resource, panel);
		preview.update(resource);
		return preview;
	}

	public reveal(sideBySide: boolean = true) {
		this.panel.reveal(getViewColumn(sideBySide));
	}

	public async update(resource: vscode.Uri) {
		if (resource.fsPath !== this.resource.fsPath) return;
		if (!this.waiting) {
			this.waiting = true;
			setTimeout(() => {
				this.waiting = false;
			}, 300);
			const doc = await vscode.workspace.openTextDocument(resource);
			const compiler = new Compiler();
			const dot = String(await compiler.compile(resource.fsPath, doc.getText(), 'dot'));
			this.panel.webview.html = this.createHtml(dot);
		}
	}


	private createHtml(dot: string) {
		return `<!DOCTYPE html>
			<html>
				<head>
					
				</head>
				<body>
				<input id="data_url_png" type="text" value="">
				<input id="svg_src" type="text" value="">
				<input id="data_url_jpg" type="text" value="">
				<input id="data_url_webp" type="text" value="">
				<script src="node_modules/@bendera/vscode-webview-elements/dist/bundled.js" type="module"></script>
				<script src="${this.getMediaPath('jquery-3.3.1.min.js')}"></script>
				<script src="${this.getMediaPath('d3.v5.min.js')}"></script>
				<script src="${this.getMediaPath('wasm.min.js')}"></script>
				<script src="${this.getMediaPath('d3-graphviz.js')}"></script>
					<p>Lorem ispum dolor</p>
					<vscode-button>Hello World!</vscode-button>
					<div id="graph"></div>
					
					<script>
					d3.select("#graph").graphviz().renderDot(\`${escapeDot(dot.toString())}\`).on('end', function() {
						const imgstart = 'data:image/svg+xml;base64,';
						
						let cnv = $('#canva'), img = $('#img'), svg = $('#graph svg')[0];
						
						let {width, height} = svg.getBBox(); 
						let clonedSVG = svg.cloneNode(true);
						let outerHTML = clonedSVG.outerHTML;
  						let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});
						let URL = window.URL || window.webkitURL || window;
						let blobURL = URL.createObjectURL(blob);
						let image = new Image();
						image.onload = () => {
							let canvas = document.createElement('canvas');
							canvas.widht = width;
							canvas.height = height;
							let context = canvas.getContext('2d');
							context.fillStyle ='#fff';
							context.fillRect(0, 0, width, height);
							context.drawImage(image, 0, 0, width, height );
							$('#data_url_png').val(canvas.toDataURL('image/png'));
							$('#data_url_jpg').val(canvas.toDataURL('image/jpeg'));
							$('#data_url_webp').val(canvas.toDataURL('image/webp'));
							$('#svg_src').val(outerHTML);
						};
						image.src = blobURL;
						
					});
					</script>
				</body>
			</html>
		`;
	}

	private getMediaPath(p: string): string {
		return Uri.file(path.join(ctx.extensionPath, 'media', p)).with({scheme: 'vscode-resource'}).toString();
	}
}