'use strict';

import path = require('path');
import vscode = require('vscode');
import { TextDocumentContentProvider, Event, EventEmitter, ExtensionContext, Uri, TextDocumentChangeEvent, ViewColumn, window, workspace } from 'vscode';
import { CompileFormat, Compiler } from './compiler';
import { MODE } from './mode';

const commandOpenPreview = 'uiflow.openPreviewSideBySide';
const commandOpenPreviewInPlace = 'uiflow.openPreviewInPlace';
const commandOpenSource = 'uiflow.openSource';

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
					buffer => resolve(String(buffer)),
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
	let d1 = vscode.commands.registerCommand(
		commandOpenPreview, uri => openPreview(uri, true));
	let d2 = vscode.commands.registerCommand(
		commandOpenPreviewInPlace, uri => openPreview(uri, false));
	let d3 = vscode.commands.registerCommand(commandOpenSource, openSource);
	context.subscriptions.push(d1, d2, d3, registration);
}

function openPreview(uri: Uri, sideBySide: boolean) {
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
	return vscode.commands.executeCommand('vscode.previewHtml', getUiflowUri(uri), getViewColumn(sideBySide));
}

function openSource(uiflowUri: Uri) {
	if (!uiflowUri) {
		return vscode.commands.executeCommand('workbench.action.navigateBack');
	}

	const docUri = Uri.parse(uiflowUri.query);

	for (let editor of vscode.window.visibleTextEditors) {
		if (editor.document.uri.toString() === docUri.toString()) {
			return vscode.window.showTextDocument(editor.document, editor.viewColumn);
		}
	}

	return vscode.workspace.openTextDocument(docUri).then(doc => {
		return vscode.window.showTextDocument(doc);
	});
}

function getUiflowUri(uri: any): Uri {
	return uri.with({
		scheme: scheme,
		path: uri.path + '.rendered',
		query: uri.toString()
	});
}

function getViewColumn(sideBySide: boolean): ViewColumn {
	let active = vscode.window.activeTextEditor;
	if (!active) {
		return ViewColumn.One;
	}

	if (!sideBySide) {
		return active.viewColumn;
	}

	switch (active.viewColumn) {
		case ViewColumn.One:
			return ViewColumn.Two;
		case ViewColumn.Two:
			return ViewColumn.Three;
	}

	return active.viewColumn;
}