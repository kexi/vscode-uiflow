'use strict';

import * as vscode from 'vscode';
import * as uiflow from 'uiflow';
import { CancellationToken, Diagnostic, DiagnosticSeverity, ExtensionContext, Range, Position, TextDocument, TextDocumentChangeEvent } from 'vscode';
import { checkUiFlow } from './util';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('uiflow');

export function activate() {
	vscode.workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
		if (!checkUiFlow(event.document)) return;
		validateTextDocument(event.document);
	});
	vscode.workspace.onDidOpenTextDocument(document => {
		if (!checkUiFlow(document)) return;
		validateTextDocument(document);
	});
}

export function createDiagnostics(document: TextDocument): Diagnostic[] {
	let diagnostics: Diagnostic[] = [];
	try {
		uiflow.parser.parse(document.getText().replace(/\r\n/g, '\n'), '');
	} catch (e) {
		let info = e.message.split(/:/g);
		let start = new Position(e.lineNumber, 0);
		let end = new Position(e.lineNumber, 1000);
		let range = new Range(start, end);
		let message = info[3] + info[4];
		let diagnostic = new Diagnostic(range, message, DiagnosticSeverity.Error);
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}

function validateTextDocument(document: TextDocument): void {
	const diagnostics = createDiagnostics(document);
	diagnosticCollection.set(document.uri, diagnostics);
}