'use strict'

import * as vscode from 'vscode'
import {
  CancellationToken,
  FoldingRangeProvider,
  FoldingContext,
  FoldingRange,
  ExtensionContext,
  TextDocument,
  ProviderResult,
} from 'vscode'
import { selector } from './mode'
import { parse } from './parser'

export function activate(context: ExtensionContext): void {
  const provider = new UiflowFoldingRangeProvider()
  const registration = vscode.languages.registerFoldingRangeProvider(
    selector,
    provider
  )
  context.subscriptions.push(registration)
}

export let foldingRangeCancellationToken: CancellationToken
export class UiflowFoldingRangeProvider implements FoldingRangeProvider {
  provideFoldingRanges(
    document: TextDocument,
    context: FoldingContext,
    token: CancellationToken
  ): ProviderResult<FoldingRange[]> {
    foldingRangeCancellationToken = token
    const tree = parse(document.getText())
    let last: FoldingRange | undefined
    const results: FoldingRange[] = tree
      .filter((v) => v.label === 'section')
      .map((v): FoldingRange => {
        if (last != null) {
          last.end = v.start.line - 2
        }
        const range: FoldingRange = {
          start: v.start.line - 1,
          end: v.end.line,
        }
        last = range
        return range
      })
    if (last != null) {
      last.end = document.lineCount - 1
    }
    return results
  }
}
