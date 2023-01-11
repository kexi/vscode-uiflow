'use strict'

import fs = require('fs')
import path = require('path')
import { Compiler } from './compiler'
import * as vscode from 'vscode'
import { Format } from '@kexi/uiflow/dist/cjs/src/app/interfaces'
import { Uri, WebviewPanel } from 'vscode'

const commandOpenExport = 'uiflow.openExport'
const commandExportSVG = 'uiflow.exportSVG'
const commandExportJSON = 'uiflow.exportJSON'
const commandExportDOT = 'uiflow.exportDOT'

type ResolveExportPath = (options?: vscode.InputBoxOptions) => Thenable<any>

const resolveExportPath: ResolveExportPath = vscode.window.showInputBox
let ctx: vscode.ExtensionContext

export function activate(context: vscode.ExtensionContext): void {
  ctx = context
  const d2 = vscode.commands.registerCommand(
    commandOpenExport,
    async (uri) => await openExport(uri)
  )
  const d4 = vscode.commands.registerCommand(
    commandExportSVG,
    async (uri) => await exportAs(uri, 'svg')
  )
  const d5 = vscode.commands.registerCommand(
    commandExportJSON,
    async (uri) => await exportAs(uri, 'json')
  )
  const d6 = vscode.commands.registerCommand(
    commandExportDOT,
    async (uri) => await exportAs(uri, 'dot')
  )
  context.subscriptions.push(d2, d4, d5, d6)
}

export async function exportAs(uri: vscode.Uri, format: Format): Promise<void> {
  try {
    const document: vscode.TextDocument = await resolveDocument(uri)
    const compiler = new Compiler()
    const data = await compiler.compile(
      document.uri.fsPath,
      document.getText(),
      format
    )
    const options: vscode.InputBoxOptions = {
      prompt: `Enter Path to Export a ${format.toUpperCase()} File`,
      value: getUserHome() ?? '' + path.sep,
    }
    const outputPath = await resolveExportPath(options)
    fs.writeFileSync(outputPath, data)
    await vscode.window.showInformationMessage(
      `Successfully Exported ${format.toUpperCase()}.`
    )
  } catch (_) {}
}

export async function resolveDocument(uri: any): Promise<vscode.TextDocument> {
  if (!(uri instanceof vscode.Uri)) {
    if (vscode.window.activeTextEditor != null) {
      uri = vscode.window.activeTextEditor.document.uri
    } else {
      await vscode.window.showWarningMessage(
        'Open UiFlow document before export.'
      )
      throw Error('Open UiFlow document before export.')
    }
  }
  const doc = await vscode.workspace.openTextDocument(uri)
  return doc
}

function getUserHome(): string | undefined {
  return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
}

export async function saveData(url: string): Promise<void> {
  const b = url.split(',')[1]
  const options: vscode.InputBoxOptions = {
    prompt: `Enter Path to Export a PNG File`,
    value: getUserHome() ?? '' + path.sep,
  }
  const outputPath = await resolveExportPath(options)
  fs.writeFileSync(outputPath, Buffer.from(b, 'base64'))
  await vscode.window.showInformationMessage('Successfully Exported PNG.')
}

async function openExport(uri: vscode.Uri): Promise<WebviewPanel | undefined> {
  if (!(uri instanceof vscode.Uri)) {
    if (vscode.window.activeTextEditor !== undefined) {
      uri = vscode.window.activeTextEditor?.document.uri
    }
  }

  if (!(uri instanceof vscode.Uri)) {
    return
  }

  const panel = vscode.window.createWebviewPanel(
    'uiflow.export',
    'Export: ' + path.basename(uri.fsPath),
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(ctx.extensionPath, 'media')),
      ],
    }
  )

  panel.webview.onDidReceiveMessage((msg) => {
    switch (msg.command) {
      case 'save-png':
        return saveData(msg.url)
    }
  })

  const doc = await vscode.workspace.openTextDocument(uri)
  const compiler = new Compiler()
  const dot = await compiler.compile(
    path.basename(uri.fsPath),
    doc.getText(),
    'dot'
  )

  panel.webview.html = createHtml(dot)

  return panel
}

function mediaPath(p: any): Uri {
  return vscode.Uri.file(path.join(ctx.extensionPath, 'media', p)).with({
    scheme: 'vscode-resource',
  })
}

// @todo fix
export function escapeDot(source: string): string {
  return String(source).replace(/[\\]/g, '\\\\')
}

function createHtml(dot: Buffer): string {
  const html = `<!DOCTYPE html>
	<html>
		<head>
			<link href="${mediaPath(
        'core.css'
      ).toString()}" rel="stylesheet" type="text/css" media="all">
			<link href="${mediaPath(
        'button.css'
      ).toString()}" rel="stylesheet" type="text/css" media="all">
			<script src="${mediaPath('d3.v5.min.js').toString()}"></script>
		<script src="${mediaPath('wasm.min.js').toString()}"></script>
		<script src="${mediaPath('d3-graphviz.js').toString()}"></script>
		<script src="${mediaPath('jquery-3.3.1.min.js').toString()}"></script>
			<script src="${mediaPath('export.js').toString()}"></script>
		</head>
	<body>
		
		<h1>Export Uiflow Diagram</h1>
		<a id="export" href="#" class="btn">Export PNG</a>
		<h1>Preview</h1>
		<div id="graph"></div>
		<input id="data_url" type="hidden" value="">
		<script>
					d3.select("#graph").graphviz().renderDot(\`${escapeDot(
            dot.toString()
          )}\`).on('end', function() {
						const imgstart = 'data:image/svg+xml;base64,';
						
						let cnv = $('#canva'), img = $('#img'), svg = $('#graph svg')[0];
						
						let {width, height} = svg.getBBox(); 
						let clonedSVG = svg.cloneNode(true);
						let outerHTML = clonedSVG.outerHTML;
  						let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});
						let URL = window.URL || window.webkitURL || window;
						let blobURL = URL.createObjectURL(blob);
						let image = new Image();
						image.onload = () => {
							let canvas = document.createElement('canvas');
							canvas.widht = width;
							canvas.height = height;
							let context = canvas.getContext('2d');
							context.fillStyle ='#fff';
							context.fillRect(0, 0, width, height);
							context.drawImage(image, 0, 0, width, height );
							$('#data_url').val(canvas.toDataURL('image/png'));
						};
						image.src = blobURL;
						
					});
					</script>
		</body>
	</html>`
  return html
}
