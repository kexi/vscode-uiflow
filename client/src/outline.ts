'use strict';

import { Compiler, CompileFormat } from './compiler';
import { languages, Position, DocumentSymbolProvider, SymbolInformation, TextDocument, CancellationToken, SymbolKind, Range, ExtensionContext } from 'vscode';
import { MODE } from './mode';

export interface Segment {
	name: string;
	lines: number;
}

export function codeToSegments(code: string): Promise<Segment[]> {
	let promise = new Promise<Segment[]>((ok, ng) => {
		Compiler.compile('', code, CompileFormat.JSON).then(buffer => {
			let json = JSON.parse(String(buffer));
			let segs: Segment[] = [];
			Object.keys(json).forEach(key => {
				segs.push(<Segment>json[key]);
			});
			ok(segs);
		});
	});
	return promise;
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