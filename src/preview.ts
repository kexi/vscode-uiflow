'use strict';

import path = require('path');
import vscode = require('vscode');
import { TextDocumentContentProvider, Event, EventEmitter, ExtensionContext, Uri, TextDocumentChangeEvent, ViewColumn, window, workspace } from 'vscode';
import { CompileFormat, Compiler } from './compiler';
import { checkUiFlow } from './util';

const commandOpenPreview = 'uiflow.openPreviewSideBySide';
const commandOpenPreviewInPlace = 'uiflow.openPreviewInPlace';
const commandOpenSource = 'uiflow.openSource';

export function activate(context: ExtensionContext) {
	const manager = new UiflowPreviewManager();
	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => {
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
				uri = vscode.window.activeTextEditor.document.uri;
			}
			if (!uri) {
				return;
			}
			manager.createOrShow(uri);
			return true;
		});
	const d2 = vscode.commands.registerCommand(
		commandOpenPreviewInPlace, uri => {
			if (!(uri instanceof Uri)) {
				uri = vscode.window.activeTextEditor.document.uri;
			}
			if (!uri) {
				return;
			}
			manager.createOrShow(uri, false);
			return true;
		});
	const d3 = vscode.commands.registerCommand(commandOpenSource, e => {
		manager.showDocument();
	});
	context.subscriptions.push(d1, d2, d3);
}

function getViewColumn(sideBySide: boolean): ViewColumn {
	const active = vscode.window.activeTextEditor;
	if (!active) {
		return ViewColumn.One;
	}

	if (!sideBySide) {
		return active.viewColumn;
	}

	return active.viewColumn + 1;
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

	public async showDocument(): Promise<vscode.TextEditor> {
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
	}

	public static create(resource: vscode.Uri, sideBySide: boolean = true): UiflowPreview {
		const panel = vscode.window.createWebviewPanel(
			UiflowPreview.viewType,
			'Preview: ' + path.basename(resource.fsPath),
			{
				viewColumn: getViewColumn(sideBySide),
				preserveFocus: false
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
			const svg = String(await Compiler.compile(resource.fsPath, doc.getText(), 'svg'));
			this.panel.webview.html = svg;
		}
	}
}