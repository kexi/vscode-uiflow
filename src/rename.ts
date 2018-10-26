'use strict';

import * as uiflow from 'uiflow';
import * as vscode from 'vscode';
import { languages, Position, RenameProvider, TextDocument, CancellationToken, Range, ExtensionContext, WorkspaceEdit } from 'vscode';
import { parse, Node } from './parser';
import { selector } from './mode';

export class UiflowRenameProvider implements RenameProvider {
	provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken): Thenable<WorkspaceEdit> {
		let nodes = parse(document.getText());
		let filtered = nodes.filter(n => ['section', 'direction'].indexOf(n.label) >= 0);
		let target = atSectionName(position, filtered);
		if (!target) {
			return Promise.resolve(null);
		}
		let edit = new WorkspaceEdit();
		filtered.filter(n => n.text === target.text).forEach(n => {
			let start = new Position(n.start.line - 1, n.start.column - 1);
			let end = new Position(n.end.line - 1, n.end.column - 1);
			let range = new Range(start, end);
			edit.replace(document.uri, range, newName);
		});
		return Promise.resolve(edit);
	}
}

function atSectionName(position: Position, filtered: Node[]): Node {
	let column = position.character + 1;
	let line = position.line + 1;
	let result = filtered.find((e: Node) => {
		if (e.start.line !== line) {
			return false;
		}
		if (e.start.column > column || e.end.column < column) {
			return false;
		}
		return true;
	});
	return result;
}

export function activate(context: ExtensionContext) {
	const provider = new UiflowRenameProvider();
	selector.forEach(s => {
		let registration = languages.registerRenameProvider(s, provider);
		context.subscriptions.push(registration);
	});
}