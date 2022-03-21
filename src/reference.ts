'use strict';

import * as uiflow from 'uiflow';
import * as vscode from 'vscode';
import { languages, Location, Position, ReferenceContext, ReferenceProvider, TextDocument, CancellationToken, Range, ExtensionContext, WorkspaceEdit } from 'vscode';
import { parse, Node } from './parser';
import { selector } from './mode';

export class UiflowReferenceProvider implements ReferenceProvider {
	provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Thenable<Location[]|null> {
		const nodes = parse(document.getText());
		const sectionNode = atSection(position, nodes);
		if (!sectionNode) {
			return Promise.resolve(null);
		}
		const locations: Location[] = nodes.filter(n => {
			if (n.label === 'direction' && n.text === sectionNode.text) {
				return true;
			}
			return false;
		}).map(directionNode => {
			const start = new Position(directionNode.start.line - 1, directionNode.start.column - 1);
			const end = new Position(directionNode.end.line - 1, directionNode.end.column - 1);
			const range = new Range(start, end);
			const location = new Location(document.uri, range);
			return location;
		});
		return Promise.resolve(locations);
	}
}

function atSection(position: Position, nodes: Node[]) {
	return nodes
	.filter(n => n.label === 'section')
	.find(n => {
		if (position.line !== n.start.line - 1) {
			return false;
		}
		if (position.character < n.start.column - 1 || position.character > n.end.column - 1) {
			return false;
		}
		return true;
	});
}

export function activate(context: ExtensionContext) {
	const provider = new UiflowReferenceProvider();
	const registration = languages.registerReferenceProvider(selector, provider);
	context.subscriptions.push(registration);
}