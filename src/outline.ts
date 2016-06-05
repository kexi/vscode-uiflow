'use strict';

import * as uiflow from 'uiflow';
import { Segment } from 'uiflow';
import { languages, Position, DocumentSymbolProvider, SymbolInformation, TextDocument, CancellationToken, SymbolKind, Range, ExtensionContext } from 'vscode';
import { MODE } from './mode';

export function codeToSegments(code: string): Thenable<Segment[]> {
	let json = uiflow.parser.parse(code, '');
	let segs: Segment[] = [];
	Object.keys(json).forEach(key => {
		segs.push(json[key]);
	});
	return Promise.resolve(segs);
}

export class UiflowDocumentSymbolProvider implements DocumentSymbolProvider {
	public provideDocumentSymbols(document: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
		let promise = new Promise<SymbolInformation[]>((ok, ng) => {
			codeToSegments(document.getText()).then(segments => {
				let info: SymbolInformation[] = [];
				segments.forEach(segment => {
					let pos = new Position(segment.lines, 0);
					let range = new Range(pos, pos);
					let si = new SymbolInformation(segment.name, SymbolKind.Class, range, document.uri);
					info.push(si);
				});
				ok(info);
			});
		});
		return promise;
	}
}

export function activate(context: ExtensionContext) {
	let registration = languages.registerDocumentSymbolProvider(MODE, new UiflowDocumentSymbolProvider());
	context.subscriptions.push(registration);
}