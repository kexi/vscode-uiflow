'use strict';

import path = require('path');
import vscode = require('vscode');
import { TextDocumentContentProvider, Event, EventEmitter, ExtensionContext, Uri, TextDocumentChangeEvent, window, workspace } from 'vscode';
import { CompileFormat, Compiler } from './compiler';
import { MODE } from './mode';

const command = 'uiflow.openPreview';
const scheme = 'uiflow';

class UiflowTextDocumentContentProvider implements TextDocumentContentProvider {
	private _onDidChange = new EventEmitter<Uri>();

	public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
		return vscode.workspace.openTextDocument(Uri.parse(uri.query)).then(doc => {
			return this.render(doc);
		});
	}

	get onDidChange(): Event<Uri> {
		return this._onDidChange.event;
	}

	public update(uri: Uri) {
		this._onDidChange.fire(uri);
	}

	private render(document: vscode.TextDocument): string | Thenable<string> {
		let code = document.getText();
		let promise = new Promise((resolve, rejected) => {
			Compiler.compile(document.uri.path, code, CompileFormat.SVG)
				.then(
					buffer => resolve(fixFont(String(buffer))),
					reason => rejected(reason));
		});
		return promise;
	}
}

export function activate(context: ExtensionContext) {
	let provider = new UiflowTextDocumentContentProvider();
	vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
		if (event.document === vscode.window.activeTextEditor.document) {
			provider.update(getUiflowUri(event.document.uri));
		}
	});
	let registration = workspace.registerTextDocumentContentProvider(scheme, provider);
	let openDiagram = vscode.commands.registerCommand(
		command, uri => showPreview(uri), vscode.ViewColumn.Two);
	context.subscriptions.push(openDiagram, registration);
}

function showPreview(uri: Uri) {
	if (!(uri instanceof Uri)) {
		if (vscode.window.activeTextEditor) {
			uri = vscode.window.activeTextEditor.document.uri;
		}
	}
	return vscode.commands.executeCommand('vscode.previewHtml', getUiflowUri(uri), vscode.ViewColumn.Two);
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

function getUiflowUri(uri: any): Uri {
	return uri.with({
		scheme: scheme,
		path: uri.path + '.rendered',
		query: uri.toString()
	});
}