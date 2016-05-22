'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, ITextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentIdentifier,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

let uiflow = require('uiflow');
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();
documents.listen(connection);
let workspaceRoot: string;

connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			completionProvider: {
				resolveProvider: true
			}
		}
	};
});

documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

function validateTextDocument(textDocument: ITextDocument): void {
	let diagnostics: Diagnostic[] = [];
	let dot;
	try {
		dot = uiflow.parser.parse(textDocument.getText().replace(/\r\n/g, '\n'), textDocument.uri);
	} catch (e) {
		let info = e.message.split(/:/g);
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: {line: e.lineNumber, character: 0},
				end: {line: e.lineNumber, character: 1000}
			},
			message: info[3] + info[4],
			source: 'uiflow'
		});
	}
	connection.sendDiagnostics({uri: textDocument.uri, diagnostics: diagnostics});
}

connection.listen();