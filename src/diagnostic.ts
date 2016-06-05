'use strict';

import * as vscode from 'vscode';
import { CancellationToken, Diagnostic, DiagnosticSeverity, ExtensionContext, Range, Position, TextDocument, TextDocumentChangeEvent } from 'vscode';
import { Compiler, CompileFormat, Meta } from './compiler';
import { MODE } from './mode';
const uiflow = require('uiflow');

export function activate() {
	vscode.workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
		validateTextDocument(event.document);
	});
	vscode.workspace.onDidOpenTextDocument(document => {
		validateTextDocument(document);
	});
}

export function createDiagnostics(document: TextDocument): Diagnostic[] {
	let diagnostics: Diagnostic[] = [];
	try {
		uiflow.parser.parse(document.getText().replace(/\r\n/g, '\n'), document.uri);
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
	let errors = vscode.languages.createDiagnosticCollection(MODE.language);
	let diagnostics = createDiagnostics(document);
	errors.set(document.uri, diagnostics);
}