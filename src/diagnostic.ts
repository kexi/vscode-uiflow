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
	const diagnostics: Diagnostic[] = [];
	try {
		uiflow.parser.parse(document.getText().replace(/\r\n/g, '\n'), '');
	} catch (e) {
		const info = e.message.split(/:/g);
		const start = new Position(e.lineNumber, 0);
		const end = new Position(e.lineNumber, 1000);
		const range = new Range(start, end);
		const message = info[3] + info[4];
		const diagnostic = new Diagnostic(range, message, DiagnosticSeverity.Error);
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}

function validateTextDocument(document: TextDocument): void {
	const diagnostics = createDiagnostics(document);
	diagnosticCollection.set(document.uri, diagnostics);
}