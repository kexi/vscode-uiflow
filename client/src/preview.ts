'use strict';

import path = require('path');
import vscode = require('vscode');
import { TextDocumentContentProvider, Event, EventEmitter, ExtensionContext, Uri, TextDocumentChangeEvent, window, workspace } from 'vscode';
import { CompileFormat, Compiler } from './compiler';
import { MODE } from './mode';

const command = 'uiflow.openPreview';
const previewUri = 'uiflow-preview://authority/uiflow-preview';
const scheme = 'uiflow-preview';

class UiflowTextDocumentContentProvider implements TextDocumentContentProvider {
	private _onDidChange = new EventEmitter<Uri>();

	public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
		let editor = window.activeTextEditor;
		if (editor.document.languageId !== MODE.language) {
			return 'Active window does not show a Uiflow document - No properties to preview.';
		}
		return this.createPreview();
	}

	get onDidChange(): Event<Uri> {
		return this._onDidChange.event;
	}

	public update(uri: Uri) {
		this._onDidChange.fire(uri);
	}

	private createPreview(): string | Thenable<string> {
		let editor = window.activeTextEditor;
		let code = editor.document.getText();
		let promise = new Promise((resolve, rejected) => {
			Compiler.compile(editor.document.uri.path, code, CompileFormat.SVG)
				.then(
					buffer => resolve(fixFont(String(buffer))),
					reason => rejected(reason));
		});
		return promise;
	}
}

export function activate(context: ExtensionContext) {
	let uri = vscode.Uri.parse(previewUri);
	let provider = new UiflowTextDocumentContentProvider();
	vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
		if (event.document === vscode.window.activeTextEditor.document) {
			provider.update(uri);
		}
	});
	vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
		if (e.textEditor === vscode.window.activeTextEditor) {
			provider.update(uri);
		}
	});
	let registration = workspace.registerTextDocumentContentProvider(scheme, provider);
	let openDiagram = vscode.commands.registerCommand(
		command,
		() => vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two));
	context.subscriptions.push(openDiagram, registration);
}

function fixFont(svg: string): string {
	let m = svg.match(/\s<text.*\s*font-family="([^"]*)"\s*font-size="([^"]*)"/);
	if (!m || m.length < 3) {
		return svg;
	}
	let family = m[1];
	let size = m[2];
	let style = `<style>text { font-size: ${size}; font-famiy: ${family}; }</style>`;
	return svg.replace('<svg', style + '<svg');
}