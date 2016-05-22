'use strict';

import * as vscode from 'vscode';
import { activate as activateClient } from './client';
import { activate as activatePreview } from './preview';
import { activate as activateExport } from './export';

export const languageId = 'uiflow';

export function activate(context: vscode.ExtensionContext) {
	activateClient(context);
	activatePreview(context);
	activateExport(context);

	let diagnosticCollection = vscode.languages.createDiagnosticCollection(languageId);
	context.subscriptions.push(diagnosticCollection);
}

export function deactivate() {
}