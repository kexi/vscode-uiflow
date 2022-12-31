'use strict'

import path = require('path')
import vscode = require('vscode')
import {
  ExtensionContext,
  Uri,
  ViewColumn,
} from 'vscode'
import { Compiler } from './compiler'
import { checkUiFlow } from './util'
import * as parser from './parser'

const commandOpenPreview = 'uiflow.openPreviewSideBySide'
const commandOpenPreviewInPlace = 'uiflow.openPreviewInPlace'
const commandOpenSource = 'uiflow.openSource'

let ctx: vscode.ExtensionContext

// @todo fix
export function escapeDot(source: string): string {
  return String(source).replace(/[\\]/g, '\\\\')
}

export function activate(context: ExtensionContext): void {
  ctx = context
  const manager = new UiflowPreviewManager()
  vscode.window.onDidChangeActiveTextEditor(
    (editor: vscode.TextEditor | undefined) => {
      if (editor == null) {
        return
      }
      if (!checkUiFlow(editor.document)) {
        return
      }
      if (
        !(vscode.workspace.getConfiguration('uiflow').get('enableAutoPreview') as boolean)
      ) {
        return
      }
      if (vscode.window.activeTextEditor != null) {
        if (editor.document === vscode.window.activeTextEditor.document) {
          manager.createOrShow(editor.document.uri)
        }
      }
    }
  )
  const d1 = vscode.commands.registerCommand(commandOpenPreview, (uri) => {
    if (!(uri instanceof Uri)) {
      uri = vscode?.window?.activeTextEditor?.document.uri
    }
    if (!uri) {
      return
    }
    manager.createOrShow(uri)
  })
  const d2 = vscode.commands.registerCommand(
    commandOpenPreviewInPlace,
    (uri) => {
      if (!(uri instanceof Uri)) {
        uri = vscode?.window?.activeTextEditor?.document.uri
      }
      if (!uri) {
        return
      }
      manager.createOrShow(uri, false)
    }
  )
  const d3 = vscode.commands.registerCommand(commandOpenSource, (e) => {
    manager.showDocument()
  })
  context.subscriptions.push(d1, d2, d3)
}

function getViewColumn(sideBySide: boolean): ViewColumn | undefined {
  const active = vscode.window.activeTextEditor
  if (active == null) {
    return ViewColumn.One
  }

  if (!sideBySide) {
    return active.viewColumn
  }

  return active?.viewColumn ? active.viewColumn + 1 : undefined
}

class UiflowPreviewManager {
  public static readonly contextKey = 'uiflowPreviewFocus'
  private readonly previews: UiflowPreview[] = []
  private activePreview: UiflowPreview | undefined
  public createOrShow(resource: vscode.Uri, sideBySide: boolean = true): void {
    const existing = this.previews.find(
      (p) => p.resource.fsPath === resource.fsPath
    )
    if (existing != null) {
      existing.reveal()
      return
    }

    const preview = UiflowPreview.create(resource, sideBySide)
    preview.onDidChangeViewState((e) => {
      this.activePreview = e.webviewPanel.active ? preview : undefined
      this.setPreviewActiveContext(e.webviewPanel.active)
    })

    preview.onDispose(() => {
      const existing = this.previews.indexOf(preview)
      if (existing === -1) {
        return
      }
      this.previews.splice(existing, 1)
      if (this.activePreview === preview) {
        this.activePreview = undefined
        this.setPreviewActiveContext(false)
      }
    })
    this.previews.push(preview)
    this.activePreview = preview
    this.setPreviewActiveContext(true)
  }

  private setPreviewActiveContext(value: boolean) {
    vscode.commands.executeCommand(
      'setContext',
      UiflowPreviewManager.contextKey,
      value
    )
  }

  public async showDocument(): Promise<vscode.TextEditor | undefined> {
    if (this.activePreview == null) {
      return
    }
    return await vscode.window.showTextDocument(this.activePreview.resource, {
      viewColumn: ViewColumn.One,
    })
  }
}

class UiflowPreview {
  public static readonly viewType = 'uiflow.preview'
  private waiting: boolean = false
  private readonly onDidChangeViewStateEmitter =
    new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>()

  public readonly onDidChangeViewState = this.onDidChangeViewStateEmitter.event
  private readonly onDisposeEmitter = new vscode.EventEmitter<void>()
  public readonly onDispose = this.onDisposeEmitter.event

  constructor(
    public readonly resource: vscode.Uri,
    private readonly panel: vscode.WebviewPanel
  ) {
    vscode.workspace.onDidChangeTextDocument((e) => {
      this.update(e.document.uri)
    })

    this.panel.onDidChangeViewState((e) => {
      this.onDidChangeViewStateEmitter.fire(e)
    })

    this.panel.onDidDispose((e) => {
      this.onDisposeEmitter.fire()
    })

    this.panel.webview.onDidReceiveMessage(async (e) => {
      let editor = vscode.window.activeTextEditor

      if (editor == null) {
        editor = await vscode.window.showTextDocument(this.resource, {
          viewColumn: ViewColumn.One,
        })
      }

      switch (e.command) {
        case 'page-click':
          const ast = parser.parse(editor.document.getText())
          const section = ast.find(
            (v) => v.label === 'section' && v.text === e.text
          )
          if (section == null) {
            return
          }
          const line = section.start.line
          const position: vscode.Position = new vscode.Position(line - 1, 0)
          editor.selection = new vscode.Selection(position, position)
          editor.revealRange(new vscode.Range(position, position))
          break
        case 'end-click':
          editor.edit((edit) => {
            if (editor != null) {
              const position: vscode.Position = new vscode.Position(
                editor.document.lineCount,
                0
              )
              const eol =
                editor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
              edit.insert(position, [eol, '[', e.text, ']', eol].join(''))
              editor.selection = new vscode.Selection(position, position)
              editor.revealRange(new vscode.Range(position, position))
            }
          })
          break
      }
    })
  }

  public static create(
    resource: vscode.Uri,
    sideBySide: boolean = true
  ): UiflowPreview {
    let viewColumn = getViewColumn(sideBySide)
    if (!viewColumn) {
      viewColumn = 1
    }
    const panel = vscode.window.createWebviewPanel(
      UiflowPreview.viewType,
      'Preview: ' + path.basename(resource.fsPath),
      {
        viewColumn,
        preserveFocus: false,
      },
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(path.join(ctx.extensionPath, 'media'))],
      }
    )

    const preview = new UiflowPreview(resource, panel)
    preview.update(resource)
    return preview
  }

  public reveal(sideBySide: boolean = true) {
    this.panel.reveal(getViewColumn(sideBySide))
  }

  public async update(resource: vscode.Uri) {
    if (resource.fsPath !== this.resource.fsPath) {
      return
    }
    if (!this.waiting) {
      this.waiting = true
      setTimeout(() => {
        this.waiting = false
      }, 300)
      const doc = await vscode.workspace.openTextDocument(resource)
      const compiler = new Compiler()
      const dot = String(
        await compiler.compile(resource.fsPath, doc.getText(), 'dot')
      )
      console.log(dot)

      this.panel.webview.html = this.createHtml(dot.replaceAll('\\', '\\\\'))
    }
  }

  private createHtml(dot: string) {
    return `<!DOCTYPE html>
			<html>
				<head>
					<script src="https://unpkg.com/jquery@3.6.0/dist/jquery.min.js"></script>
					<script src="https://unpkg.com/d3@5.16.0/dist/d3.min.js"></script>
					<script src="https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js"></script>
					<script src="https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js"></script>
				</head>
				<body>
					<div id="graph"></div>
					
					<script>
						d3.select("#graph").graphviz().renderDot(\`${dot}\`);
					</script>
				</body>
			</html>
		`
  }

  private getMediaPath(p: string): string {
    return Uri.file(path.join(ctx.extensionPath, 'media', p))
      .with({ scheme: 'vscode-resource' })
      .toString()
  }
}
