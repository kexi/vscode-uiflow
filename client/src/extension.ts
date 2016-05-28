'use strict';

import * as vscode from 'vscode';
import { activate as activateClient } from './client';
import { activate as activatePreview } from './preview';
import { activate as activateExport } from './export';
import { activate as activateDocumentSymbolProvider } from './outline';
import { activate as activateCompletionItemProvider } from './suggest';
import { MODE } from './mode';

export function activate(context: vscode.ExtensionContext) {
	activateClient(context);
	activatePreview(context);
	activateExport(context);
	activateDocumentSymbolProvider(context);
	activateCompletionItemProvider(context);

	let diagnosticCollection = vscode.languages.createDiagnosticCollection(MODE.language);
	context.subscriptions.push(diagnosticCollection);
}

export function deactivate() {
}