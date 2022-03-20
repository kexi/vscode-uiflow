'use strict';

import * as vscode from 'vscode';
import * as uiflow from 'uiflow';
import { CancellationToken, CompletionList, Definition, FoldingRangeProvider, FoldingContext, FoldingRange, ExtensionContext, Location, TextDocument, Position, ProviderResult } from 'vscode';
import { selector } from './mode';
import { parse } from './parser';

export function activate(context: ExtensionContext) {
	const provider = new UiflowFoldingRangeProvider();
	const registration = vscode.languages.registerFoldingRangeProvider(selector, provider);
	context.subscriptions.push(registration);
}

export class UiflowFoldingRangeProvider implements FoldingRangeProvider {
	provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {
		const tree = parse(document.getText());
		let last: FoldingRange|undefined;
		const results: FoldingRange[] = tree.filter(v => v.label === 'section')
		.map(
			(v): FoldingRange => {
				if (last) {
					last.end = v.start.line - 2;
				}
				const range: FoldingRange = {
					start: v.start.line - 1,
					end: v.end.line
				};
				last = range;
				return range;
			}
		);
		if (last) {
			last.end = document.lineCount - 1;
		}
		return results;
	}
}