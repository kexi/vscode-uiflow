'use strict';

import * as vscode from 'vscode';
import { activate as activatePreview } from './preview';
import { activate as activateExport } from './export';
import { activate as activateDocumentSymbolProvider } from './outline';
import { activate as activateCompletionItemProvider } from './suggest';
import { activate as activateDefinitionProvider } from './definition';
import { activate as activateDiagnostic } from './diagnostic';
import { MODE } from './mode';

export function activate(context: vscode.ExtensionContext) {
	activatePreview(context);
	activateExport(context);
	activateDocumentSymbolProvider(context);
	activateCompletionItemProvider(context);
	activateDefinitionProvider(context);
	activateDiagnostic();
}

export function deactivate() {
}