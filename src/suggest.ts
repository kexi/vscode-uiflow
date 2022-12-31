'use strict'

import * as vscode from 'vscode'
import uiflow from '@kexi/uiflow'
import { selector } from './mode'

export function activate(context: vscode.ExtensionContext): void {
  const provider = new UiflowCompletionItemProvider()
  const registration = vscode.languages.registerCompletionItemProvider(
    selector,
    provider,
    ...UiflowCompletionItemProvider.triggerCharacters
  )
  context.subscriptions.push(registration)
}

export let completionItemCancellationToken: vscode.CancellationToken
export class UiflowCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  public static readonly triggerCharacters = ['>', ' ']
  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.CompletionItem[] {
    completionItemCancellationToken = token
    const lineText = document.lineAt(position.line)
    if (lineText.text.substring(0, position.character).match(/=.*=>/) == null) {
      return []
    }
    const json = uiflow.parser.parse(document.getText(), '')
    const list: vscode.CompletionItem[] = []
    Object.keys(json).forEach((key) => {
      const section = json[key]
      const item = new vscode.CompletionItem(section.name)
      item.kind = vscode.CompletionItemKind.Class
      list.push(item)
    })
    return list
  }
}
