'use strict';

import * as uiflow from 'uiflow';
import { Section } from 'uiflow';
import { languages, Position, DocumentSymbolProvider, SymbolInformation, TextDocument, CancellationToken, SymbolKind, Range, ExtensionContext } from 'vscode';
import { selector } from './mode';

export function codeToSections(code: string): Thenable<Section[]> {
	const json = uiflow.parser.parse(code, '');
	const segs: Section[] = [];
	Object.keys(json).forEach(key => {
		segs.push(json[key]);
	});
	return Promise.resolve(segs);
}

export class UiflowDocumentSymbolProvider implements DocumentSymbolProvider {
	public provideDocumentSymbols(document: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
		const promise = new Promise<SymbolInformation[]>((ok, ng) => {
			codeToSections(document.getText()).then(sections => {
				const info: SymbolInformation[] = [];
				sections.forEach(section => {
					const pos = new Position(section.lines, 0);
					const range = new Range(pos, pos);
					const si = new SymbolInformation(section.name, SymbolKind.Class, range, document.uri);
					info.push(si);
				});
				ok(info);
			});
		});
		return promise;
	}
}

export function activate(context: ExtensionContext) {
	const providor = new UiflowDocumentSymbolProvider();
	const registration = languages.registerDocumentSymbolProvider(selector, providor);
	context.subscriptions.push(registration);
}