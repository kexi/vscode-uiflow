import * as vscode from 'vscode';

export function checkUiFlow(doc: vscode.TextDocument): boolean {
	if (doc.languageId !== 'uiflow') return false;
	return ['file', 'untitled'].indexOf(doc.uri.scheme) >= 0;
}