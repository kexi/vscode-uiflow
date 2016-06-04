'use strict';

import * as vscode from 'vscode';
import { CancellationToken, CompletionList, Definition, DefinitionProvider, ExtensionContext, Location, TextDocument, Position } from 'vscode';
import { Compiler, CompileFormat, Meta } from './compiler';
import { MODE } from './mode';

export function activate(context: ExtensionContext) {
	let registration = vscode.languages.registerDefinitionProvider(MODE, new UiflowDefinitionProvider());
	context.subscriptions.push(registration);
}

export class UiflowDefinitionProvider implements DefinitionProvider {
	public provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
		let lineText = document.lineAt(position.line);
		if (!lineText.text.substring(0, position.character).match(/=.*=>/)) {
			return Promise.resolve(null);
		}
		let match = lineText.text.match(/=.*=>+\s*([^:\]]*)/);
		if (!match) {
			return Promise.resolve(null);
		}
		let name = match[1];
		return Compiler.compile('', document.getText(), CompileFormat.JSON)
		.then(buffer => {
			let json: Meta = JSON.parse(String(buffer));
			let segment = json[name];
			if (!segment) {
				return null;
			}
			let position = new Position(segment.lines, 0);
			let location = new Location(document.uri, position);
			return location;
		});
	}
}