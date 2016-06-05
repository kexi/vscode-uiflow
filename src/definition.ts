'use strict';

import * as vscode from 'vscode';
import * as uiflow from 'uiflow';
import { CancellationToken, CompletionList, Definition, DefinitionProvider, ExtensionContext, Location, TextDocument, Position } from 'vscode';
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
		let json = uiflow.parser.parse(document.getText(), '');
		let segment = json[name];
		if (!segment) {
				return Promise.resolve(null);
		}
		let pos = new Position(segment.lines, 0);
		let location = new Location(document.uri, pos);
		return Promise.resolve(location);
	}
}