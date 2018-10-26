'use strict';

import * as uiflow from 'uiflow';
import { Section } from 'uiflow';
import { languages, Position, DocumentSymbolProvider, SymbolInformation, TextDocument, CancellationToken, SymbolKind, Range, ExtensionContext } from 'vscode';
import { selector } from './mode';

export function codeToSections(code: string): Thenable<Section[]> {
	let json = uiflow.parser.parse(code, '');
	let segs: Section[] = [];
	Object.keys(json).forEach(key => {
		segs.push(json[key]);
	});
	return Promise.resolve(segs);
}

export class UiflowDocumentSymbolProvider implements DocumentSymbolProvider {
	public provideDocumentSymbols(document: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
		let promise = new Promise<SymbolInformation[]>((ok, ng) => {
			codeToSections(document.getText()).then(sections => {
				let info: SymbolInformation[] = [];
				sections.forEach(section => {
					let pos = new Position(section.lines, 0);
					let range = new Range(pos, pos);
					let si = new SymbolInformation(section.name, SymbolKind.Class, range, document.uri);
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
	selector.forEach(s => {
		const registration = languages.registerDocumentSymbolProvider(s, providor);
		context.subscriptions.push(registration);
	});
}