'use strict'

import uiflow from '@kexi/uiflow'

import {
  languages,
  Position,
  DocumentSymbolProvider,
  SymbolInformation,
  TextDocument,
  CancellationToken,
  SymbolKind,
  Range,
  ExtensionContext,
} from 'vscode'
import { selector } from './mode'

interface Section {
  name: string
  lines: number
}

export function codeToSections(code: string): Thenable<Section[]> {
  const json = uiflow.parser.parse(code, '')
  const segs: Section[] = []
  Object.keys(json).forEach((key) => {
    const j = json[key]
    segs.push({
      name: j.name,
      lines: j.lines ?? 0
    })
  })
  return Promise.resolve(segs)
}

export let documentSymbolCancellationToken: CancellationToken
export class UiflowDocumentSymbolProvider implements DocumentSymbolProvider {
  public async provideDocumentSymbols(
    document: TextDocument,
    token: CancellationToken
  ): Promise<SymbolInformation[]> {
    documentSymbolCancellationToken = token
    const promise = new Promise<SymbolInformation[]>((_resolve, _reject) => {
      void codeToSections(document.getText()).then((sections) => {
        const info: SymbolInformation[] = []
        sections.forEach((section) => {
          const pos = new Position(section.lines, 0)
          const range = new Range(pos, pos)
          const si = new SymbolInformation(
            section.name,
            SymbolKind.Class,
            range,
            document.uri
          )
          info.push(si)
        })
        _resolve(info)
      })
    })
    return await promise
  }
}

export function activate(context: ExtensionContext): void {
  const providor = new UiflowDocumentSymbolProvider()
  const registration = languages.registerDocumentSymbolProvider(
    selector,
    providor
  )
  context.subscriptions.push(registration)
}
