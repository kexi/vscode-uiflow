'use strict'

import * as vscode from 'vscode'

export const selector: vscode.DocumentFilter[] = [
  { scheme: 'file', language: 'uiflow' },
  { scheme: 'untitled', language: 'uiflow' },
]
