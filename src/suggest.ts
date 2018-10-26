'use strict';

import * as vscode from 'vscode';
import * as uiflow from 'uiflow';
import { CancellationToken, CompletionList, CompletionItemKind, CompletionItem, CompletionItemProvider, ExtensionContext, TextDocument, Position} from 'vscode';
import { selector } from './mode';

export function activate(context: ExtensionContext) {
	const provider = new UiflowCompletionItemProvider();
	selector.forEach(s => {
		const registration = vscode.languages.registerCompletionItemProvider(s, provider);
		context.subscriptions.push(registration);
	});
}

export class UiflowCompletionItemProvider implements CompletionItemProvider {
	public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
		let lineText = document.lineAt(position.line);
		if (!lineText.text.substring(0, position.character).match(/=.*=>/)) {
			return Promise.resolve([]);
		}
		let json = uiflow.parser.parse(document.getText(), '');
		let list: CompletionItem[] = [];
		Object.keys(json).forEach(key => {
			let section = json[key];
			let item = new CompletionItem(section.name);
			item.kind = CompletionItemKind.Class;
			list.push(item);
		});
		return Promise.resolve(list);
	}
}