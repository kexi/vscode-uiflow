'use strict';

import * as vscode from 'vscode';
import { activate as activatePreview } from './preview';
import { activate as activateExport } from './export';
import { activate as activateDocumentSymbolProvider } from './outline';
import { activate as activateCompletionItemProvider } from './suggest';
import { activate as activateDefinitionProvider } from './definition';
import { activate as activateDiagnostic } from './diagnostic';
import { activate as activateRenameProvider } from './rename';
import { activate as activateReferenceProvider } from './reference';
import { activate as activateExportPNG } from './export2';
import { MODE } from './mode';

export function activate(context: vscode.ExtensionContext) {
	activatePreview(context);
	activateExport(context);
	activateExportPNG(context);
	activateDocumentSymbolProvider(context);
	activateCompletionItemProvider(context);
	activateDefinitionProvider(context);
	activateRenameProvider(context);
	activateReferenceProvider(context);
	activateDiagnostic();
}

export function deactivate() {
}