'use strict'

import * as vscode from 'vscode'
import { activate as activatePreview } from './preview'
import { activate as activateExport } from './export'
import { activate as activateDocumentSymbolProvider } from './outline'
import { activate as activateCompletionItemProvider } from './suggest'
import { activate as activateDefinitionProvider } from './definition'
import { activate as activateDiagnostic } from './diagnostic'
import { activate as activateRenameProvider } from './rename'
import { activate as activateReferenceProvider } from './reference'
import { activate as activateFoldingProvider } from './folding'

export function activate(context: vscode.ExtensionContext): void {
  activatePreview(context)
  activateExport(context)
  activateDocumentSymbolProvider(context)
  activateCompletionItemProvider(context)
  activateDefinitionProvider(context)
  activateRenameProvider(context)
  activateReferenceProvider(context)
  activateFoldingProvider(context)
  activateDiagnostic()
}

export function deactivate(): void {}
