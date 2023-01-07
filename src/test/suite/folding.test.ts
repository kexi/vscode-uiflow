'use strict'

import * as assert from 'assert'
import * as vscode from 'vscode'
import * as path from 'path'
import {
  foldingRangeCancellationToken,
  UiflowFoldingRangeProvider,
} from '../../folding'
import fs = require('fs')
import os = require('os')

suite('UiFlow Folding Tests', () => {
  let fixturePath: string
  let fixtureSourcePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'src',
    'test',
    'suite',
    'fixtures'
  )

  suiteSetup(() => {
    fixturePath = fs.mkdtempSync(path.join(os.tmpdir(), 'fixtures'))
    fs.copyFileSync(
      path.join(fixtureSourcePath, 'folding.uif'),
      path.join(fixturePath, 'folding.uif')
    )
  })

  test('Test provideFoldingRanges#UiflowFoldingRangeProvider', async () => {
    const doc = await vscode.workspace.openTextDocument(
      path.join(fixturePath, 'folding.uif')
    )
    const provider = new UiflowFoldingRangeProvider()
    const context: vscode.FoldingContext = {}
    const ranges = await provider.provideFoldingRanges(
      doc,
      context,
      foldingRangeCancellationToken
    )
    assert.equal(
      JSON.stringify(ranges),
      JSON.stringify([
        { start: 0, end: 5 },
        { start: 6, end: 11 },
        { start: 12, end: 17 },
      ])
    )
  })
})
