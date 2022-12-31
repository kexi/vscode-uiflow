'use strict'

import {
    languages,
    Position,
    RenameProvider,
    TextDocument,
    CancellationToken,
    Range,
    ExtensionContext,
    WorkspaceEdit,
} from 'vscode'
import {parse, Node} from './parser'
import {selector} from './mode'

export var renameCancellationToken: CancellationToken

export class UiflowRenameProvider implements RenameProvider {
    provideRenameEdits(
        document: TextDocument,
        position: Position,
        newName: string,
        token: CancellationToken
    ): Thenable<WorkspaceEdit | null> {
        renameCancellationToken = token
        const nodes = parse(document.getText())
        const filtered = nodes.filter(
            (n) => ['section', 'direction'].includes(n.label)
        )
        const target = atSectionName(position, filtered)
        if (target == null) {
            return Promise.resolve(null)
        }
        const edit = new WorkspaceEdit()
        filtered
            .filter((n) => n.text === target.text)
            .forEach((n) => {
                const start = new Position(n.start.line - 1, n.start.column - 1)
                const end = new Position(n.end.line - 1, n.end.column - 1)
                const range = new Range(start, end)
                edit.replace(document.uri, range, newName)
            })
        return Promise.resolve(edit)
    }
}

function atSectionName(position: Position, filtered: Node[]): Node | undefined {
    const column = position.character + 1
    const line = position.line + 1
    const result = filtered.find((e: Node) => {
        if (e.start.line !== line) {
            return false
        }
        if (e.start.column > column || e.end.column < column) {
            return false
        }
        return true
    })
    return result
}

export function activate(context: ExtensionContext): void {
    const provider = new UiflowRenameProvider()
    const registration = languages.registerRenameProvider(selector, provider)
    context.subscriptions.push(registration)
}
