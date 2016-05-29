'use strict';

import * as vscode from 'vscode';
import { CancellationToken, CompletionList, CompletionItemKind, CompletionItem, CompletionItemProvider, ExtensionContext, TextDocument, Position} from 'vscode';
import { Compiler, CompileFormat, Meta } from './compiler';
import { MODE } from './mode';

export function activate(context: ExtensionContext) {
	let registration = vscode.languages.registerCompletionItemProvider(MODE, new UiflowCompletionItemProvider());
	context.subscriptions.push(registration);
}

export class UiflowCompletionItemProvider implements CompletionItemProvider {
	public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
		let lineText = document.lineAt(position.line);
		if (!lineText.text.substring(0, position.character).match(/=.*=>/)) {
			return Promise.resolve([]);
		}
		return Compiler.compile('', document.getText(), CompileFormat.JSON).then(buffer => {
			let json: Meta = JSON.parse(String(buffer));
			let list: CompletionItem[] = [];
			Object.keys(json).forEach(key => {
				let segment = json[key];
				let item = new CompletionItem(segment.name);
				item.kind = CompletionItemKind.Class;
				list.push(item);
			});
			return list;
		});
	}
}