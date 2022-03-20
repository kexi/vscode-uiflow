/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 4:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Compiler = exports.CompileFormat = void 0;
const uiflow = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'uiflow'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const through2 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'through2'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class CompileFormat {
}
exports.CompileFormat = CompileFormat;
CompileFormat.SVG = 'svg';
CompileFormat.PNG = 'png';
CompileFormat.JSON = 'json';
CompileFormat.DOT = 'dot';
class Compiler {
    buildWithCode(fileName, code, format, errorHandler) {
        return uiflow.buildWithCode(fileName, code.replace(/\r\n/g, '\n'), format, errorHandler);
    }
    compile(fileName, code, format) {
        let promise = new Promise((resolve, rejected) => {
            let buff = [];
            let output = through2((chunk, enc, callback) => {
                buff.push(chunk);
                callback();
            });
            let stream = this.buildWithCode(fileName, code, format, e => {
                rejected(e);
            });
            stream.pipe(output);
            stream.on('end', () => {
                let all = Buffer.concat(buff);
                resolve(all);
                output.end();
            });
        });
        return promise;
    }
}
exports.Compiler = Compiler;


/***/ }),

/***/ 63:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UiflowDefinitionProvider = exports.activate = void 0;
const vscode = __webpack_require__(3);
const uiflow = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'uiflow'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const vscode_1 = __webpack_require__(3);
const mode_1 = __webpack_require__(61);
function activate(context) {
    const provider = new UiflowDefinitionProvider();
    const registration = vscode.languages.registerDefinitionProvider(mode_1.selector, provider);
    context.subscriptions.push(registration);
}
exports.activate = activate;
class UiflowDefinitionProvider {
    provideDefinition(document, position, token) {
        const lineText = document.lineAt(position.line);
        if (!lineText.text.substring(0, position.character).match(/=.*=>/)) {
            return undefined;
        }
        const match = lineText.text.match(/=.*=>+\s*([^:\]]*)/);
        if (!match) {
            return undefined;
        }
        const name = match[1];
        const json = uiflow.parser.parse(document.getText(), '');
        const section = json[name];
        if (!section) {
            return undefined;
        }
        const pos = new vscode_1.Position(section.lines, 0);
        const location = new vscode_1.Location(document.uri, pos);
        return location;
    }
}
exports.UiflowDefinitionProvider = UiflowDefinitionProvider;


/***/ }),

/***/ 64:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createDiagnostics = exports.activate = void 0;
const vscode = __webpack_require__(3);
const uiflow = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'uiflow'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const vscode_1 = __webpack_require__(3);
const util_1 = __webpack_require__(55);
const diagnosticCollection = vscode.languages.createDiagnosticCollection('uiflow');
function activate() {
    vscode.workspace.onDidChangeTextDocument((event) => {
        if (!(0, util_1.checkUiFlow)(event.document))
            return;
        validateTextDocument(event.document);
    });
    vscode.workspace.onDidOpenTextDocument(document => {
        if (!(0, util_1.checkUiFlow)(document))
            return;
        validateTextDocument(document);
    });
}
exports.activate = activate;
function createDiagnostics(document) {
    const diagnostics = [];
    try {
        uiflow.parser.parse(document.getText().replace(/\r\n/g, '\n'), '');
    }
    catch (e) {
        const info = e.message.split(/:/g);
        const start = new vscode_1.Position(e.lineNumber, 0);
        const end = new vscode_1.Position(e.lineNumber, 1000);
        const range = new vscode_1.Range(start, end);
        const message = info[3] + info[4];
        const diagnostic = new vscode_1.Diagnostic(range, message, vscode_1.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
    }
    return diagnostics;
}
exports.createDiagnostics = createDiagnostics;
function validateTextDocument(document) {
    const diagnostics = createDiagnostics(document);
    diagnosticCollection.set(document.uri, diagnostics);
}


/***/ }),

/***/ 58:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.saveData = exports.setResovleExportPath = exports.resolveDocument = exports.exportAs = exports.activate = void 0;
const fs = __webpack_require__(6);
const path = __webpack_require__(2);
const compiler_1 = __webpack_require__(4);
const vscode = __webpack_require__(3);
const js_base64_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'js-base64'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const commandOpenExport = 'uiflow.openExport';
const commandExportSVG = 'uiflow.exportSVG';
const commandExportJSON = 'uiflow.exportJSON';
const commandExportDOT = 'uiflow.exportDOT';
let resolveExportPath = vscode.window.showInputBox;
let ctx;
function activate(context) {
    ctx = context;
    const d2 = vscode.commands.registerCommand(commandOpenExport, uri => openExport(uri));
    const d4 = vscode.commands.registerCommand(commandExportSVG, uri => exportAs(uri, compiler_1.CompileFormat.SVG));
    const d5 = vscode.commands.registerCommand(commandExportJSON, uri => exportAs(uri, compiler_1.CompileFormat.JSON));
    const d6 = vscode.commands.registerCommand(commandExportDOT, uri => exportAs(uri, compiler_1.CompileFormat.DOT));
    context.subscriptions.push(d2, d4, d5, d6);
}
exports.activate = activate;
async function exportAs(uri, format) {
    try {
        const document = await resolveDocument(uri);
        const compiler = new compiler_1.Compiler();
        const data = await compiler.compile(document.uri.fsPath, document.getText(), format);
        const options = {
            prompt: `Enter Path to Export a ${format.toUpperCase()} File`,
            value: getUserHome() + path.sep
        };
        const outputPath = await resolveExportPath(options);
        fs.writeFileSync(outputPath, data);
        vscode.window.showInformationMessage(`Successfully Exported ${format.toUpperCase()}.`);
    }
    catch (_) {
        return;
    }
}
exports.exportAs = exportAs;
async function resolveDocument(uri) {
    if (!(uri instanceof vscode.Uri)) {
        if (vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
        else {
            vscode.window.showWarningMessage('Open UiFlow document before export.');
            throw Error('Open UiFlow document before export.');
        }
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    return doc;
}
exports.resolveDocument = resolveDocument;
function setResovleExportPath(resolver) {
    resolveExportPath = resolver;
}
exports.setResovleExportPath = setResovleExportPath;
function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
async function saveData(url) {
    const b = url.split(',')[1];
    const options = {
        prompt: `Enter Path to Export a PNG File`,
        value: getUserHome() + path.sep
    };
    const outputPath = await resolveExportPath(options);
    fs.writeFileSync(outputPath, new Buffer(b, 'base64'));
    vscode.window.showInformationMessage('Successfully Exported PNG.');
}
exports.saveData = saveData;
async function openExport(uri) {
    if (!(uri instanceof vscode.Uri)) {
        if (vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
    }
    if (!(uri instanceof vscode.Uri)) {
        return;
    }
    const panel = vscode.window.createWebviewPanel('uiflow.export', 'Export: ' + path.basename(uri.fsPath), vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.file(path.join(ctx.extensionPath, 'media'))
        ]
    });
    panel.webview.onDidReceiveMessage(msg => {
        switch (msg.command) {
            case 'save-png':
                saveData(msg.url);
        }
    });
    const doc = await vscode.workspace.openTextDocument(uri);
    const compiler = new compiler_1.Compiler();
    const svg = await compiler.compile(path.basename(uri.fsPath), doc.getText(), 'svg');
    panel.webview.html = createHtml(svg);
    return panel;
}
function mediaPath(p) {
    return vscode.Uri.file(path.join(ctx.extensionPath, 'media', p)).with({ scheme: 'vscode-resource' });
}
function createHtml(svg) {
    const html = `<!DOCTYPE html>
	<html>
		<head>
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src vscode-resource:; script-src vscode-resource:; img-src data:;">
			<link href="${mediaPath('core.css')}" rel="stylesheet" type="text/css" media="all">
			<link href="${mediaPath('button.css')}" rel="stylesheet" type="text/css" media="all">
			<script src="${mediaPath('jquery-3.3.1.min.js')}"></script>
			<script src="${mediaPath('export.js')}"></script>
		</head>
	<body>
		<h1>Export Uiflow Diagram</h1>
		<a id="export" href="#" class="btn">Export PNG</a>
		<h1>Preview</h1>
		<div id="img_cnt">
			<h2>img</h2>
			<img id="img" src="data:image/svg+xml;base64,${js_base64_1.Base64.encode(svg.toString().replace(/\u0008/g, ''))}">
			</div>
		<div id="svg_cnt">
			<h2>svg</h2>
			${svg}
		</div>
		<div id="canvas_cnt">
			<h2>canvas</h2>
			<canvas></canvas>
		</div>
		</body>
	</html>`;
    return html;
}


/***/ }),

/***/ 67:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UiflowFoldingRangeProvider = exports.activate = void 0;
const vscode = __webpack_require__(3);
const mode_1 = __webpack_require__(61);
const parser_1 = __webpack_require__(56);
function activate(context) {
    const provider = new UiflowFoldingRangeProvider();
    const registration = vscode.languages.registerFoldingRangeProvider(mode_1.selector, provider);
    context.subscriptions.push(registration);
}
exports.activate = activate;
class UiflowFoldingRangeProvider {
    provideFoldingRanges(document, context, token) {
        const tree = (0, parser_1.parse)(document.getText());
        let last;
        const results = tree.filter(v => v.label === 'section')
            .map((v) => {
            if (last) {
                last.end = v.start.line - 2;
            }
            const range = {
                start: v.start.line - 1,
                end: undefined
            };
            last = range;
            return range;
        });
        if (last) {
            last.end = document.lineCount - 1;
        }
        return results;
    }
}
exports.UiflowFoldingRangeProvider = UiflowFoldingRangeProvider;


/***/ }),

/***/ 61:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selector = void 0;
exports.selector = [
    { scheme: 'file', language: 'uiflow' },
    { scheme: 'untitled', language: 'uiflow' }
];


/***/ }),

/***/ 60:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = exports.UiflowDocumentSymbolProvider = exports.codeToSections = void 0;
const uiflow = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'uiflow'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const vscode_1 = __webpack_require__(3);
const mode_1 = __webpack_require__(61);
function codeToSections(code) {
    const json = uiflow.parser.parse(code, '');
    const segs = [];
    Object.keys(json).forEach(key => {
        segs.push(json[key]);
    });
    return Promise.resolve(segs);
}
exports.codeToSections = codeToSections;
class UiflowDocumentSymbolProvider {
    provideDocumentSymbols(document, token) {
        const promise = new Promise((ok, ng) => {
            codeToSections(document.getText()).then(sections => {
                const info = [];
                sections.forEach(section => {
                    const pos = new vscode_1.Position(section.lines, 0);
                    const range = new vscode_1.Range(pos, pos);
                    const si = new vscode_1.SymbolInformation(section.name, vscode_1.SymbolKind.Class, range, document.uri);
                    info.push(si);
                });
                ok(info);
            });
        });
        return promise;
    }
}
exports.UiflowDocumentSymbolProvider = UiflowDocumentSymbolProvider;
function activate(context) {
    const providor = new UiflowDocumentSymbolProvider();
    const registration = vscode_1.languages.registerDocumentSymbolProvider(mode_1.selector, providor);
    context.subscriptions.push(registration);
}
exports.activate = activate;


/***/ }),

/***/ 56:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = exports.walk = void 0;
const parsimmon_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'parsimmon'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
let lsec = (0, parsimmon_1.regex)(/.*\[/);
let rsec = (0, parsimmon_1.regex)(/\].*/);
let sectionText = (0, parsimmon_1.regex)(/[^#\]]+/).map(text => { return { label: 'section', text: text }; }).mark();
let rank = (0, parsimmon_1.regex)(/#*/);
let section = (0, parsimmon_1.seqMap)(lsec, sectionText, rsec, (...params) => params[1]);
let equal = (0, parsimmon_1.regex)(/=+/);
let lapi = (0, parsimmon_1.string)('{');
let rapi = (0, parsimmon_1.string)('}');
let api = (0, parsimmon_1.regex)(/[^}]+/).map(text => { return { label: 'api', text: text }; }).mark();
let directionText = (0, parsimmon_1.regex)(/.*/).map(text => { return { label: 'direction', text: text }; }).mark();
let lt = (0, parsimmon_1.string)('>').skip(parsimmon_1.optWhitespace);
let directionWithoutApi = (0, parsimmon_1.seqMap)(equal, lt, directionText, (...params) => params[2]);
let directionWithApi = (0, parsimmon_1.seqMap)(equal, lapi, api, rapi, equal, lt, directionText, (...params) => [params[2], params[6]]);
let direction = (0, parsimmon_1.alt)(directionWithoutApi, directionWithApi);
let text = (0, parsimmon_1.regex)(/.*/).mark().map(text => {
    return { label: 'text', text: text };
});
let line = parsimmon_1.optWhitespace.then((0, parsimmon_1.alt)(section, direction, text));
let eol = (0, parsimmon_1.regex)(/\r?\n/);
let parser = (0, parsimmon_1.sepBy)(line, eol);
function walk(nodes, val) {
    if (val instanceof Array) {
        val.forEach(v => walk(nodes, v));
    }
    if (val instanceof Object) {
        let start, end;
        if (val.hasOwnProperty('start'))
            start = val.start;
        if (val.hasOwnProperty('end'))
            end = val.end;
        if (val.hasOwnProperty('value')) {
            let value = val.value;
            nodes.push({ label: value.label, text: value.text, start: start, end: end });
        }
    }
}
exports.walk = walk;
function parse(code) {
    let ast = parser.parse(code);
    if (!ast.status) {
        throw new Error(ast.expected);
    }
    let nodes = [];
    walk(nodes, ast.value);
    return nodes;
}
exports.parse = parse;


/***/ }),

/***/ 1:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const path = __webpack_require__(2);
const vscode = __webpack_require__(3);
const vscode_1 = __webpack_require__(3);
const compiler_1 = __webpack_require__(4);
const util_1 = __webpack_require__(55);
const parser = __webpack_require__(56);
const commandOpenPreview = 'uiflow.openPreviewSideBySide';
const commandOpenPreviewInPlace = 'uiflow.openPreviewInPlace';
const commandOpenSource = 'uiflow.openSource';
let ctx;
function activate(context) {
    ctx = context;
    const manager = new UiflowPreviewManager();
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!(0, util_1.checkUiFlow)(editor.document))
            return;
        if (!vscode.workspace.getConfiguration('uiflow').get('enableAutoPreview'))
            return;
        if (vscode.window.activeTextEditor) {
            if (editor.document === vscode.window.activeTextEditor.document) {
                manager.createOrShow(editor.document.uri);
            }
        }
    });
    const d1 = vscode.commands.registerCommand(commandOpenPreview, uri => {
        if (!(uri instanceof vscode_1.Uri)) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
            return;
        }
        manager.createOrShow(uri);
    });
    const d2 = vscode.commands.registerCommand(commandOpenPreviewInPlace, uri => {
        if (!(uri instanceof vscode_1.Uri)) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
            return;
        }
        manager.createOrShow(uri, false);
    });
    const d3 = vscode.commands.registerCommand(commandOpenSource, e => {
        manager.showDocument();
    });
    context.subscriptions.push(d1, d2, d3);
}
exports.activate = activate;
function getViewColumn(sideBySide) {
    const active = vscode.window.activeTextEditor;
    if (!active) {
        return vscode_1.ViewColumn.One;
    }
    if (!sideBySide) {
        return active.viewColumn;
    }
    return active.viewColumn + 1;
}
class UiflowPreviewManager {
    constructor() {
        this.previews = [];
    }
    createOrShow(resource, sideBySide = true) {
        const existing = this.previews.find(p => p.resource.fsPath === resource.fsPath);
        if (existing) {
            existing.reveal();
            return;
        }
        const preview = UiflowPreview.create(resource, sideBySide);
        preview.onDidChangeViewState(e => {
            this.activePreview = e.webviewPanel.active ? preview : undefined;
            this.setPreviewActiveContext(e.webviewPanel.active);
        });
        preview.onDispose(() => {
            const existing = this.previews.indexOf(preview);
            if (existing === -1)
                return;
            this.previews.splice(existing, 1);
            if (this.activePreview === preview) {
                this.activePreview = undefined;
                this.setPreviewActiveContext(false);
            }
        });
        this.previews.push(preview);
        this.activePreview = preview;
        this.setPreviewActiveContext(true);
    }
    setPreviewActiveContext(value) {
        vscode.commands.executeCommand('setContext', UiflowPreviewManager.contextKey, value);
    }
    async showDocument() {
        if (!this.activePreview)
            return;
        return vscode.window.showTextDocument(this.activePreview.resource, { viewColumn: vscode_1.ViewColumn.One });
    }
}
UiflowPreviewManager.contextKey = 'uiflowPreviewFocus';
class UiflowPreview {
    constructor(resource, panel) {
        this.resource = resource;
        this.panel = panel;
        this.waiting = false;
        this.onDidChangeViewStateEmitter = new vscode.EventEmitter();
        this.onDidChangeViewState = this.onDidChangeViewStateEmitter.event;
        this.onDisposeEmitter = new vscode.EventEmitter();
        this.onDispose = this.onDisposeEmitter.event;
        vscode.workspace.onDidChangeTextDocument(e => {
            this.update(e.document.uri);
        });
        this.panel.onDidChangeViewState(e => {
            this.onDidChangeViewStateEmitter.fire(e);
        });
        this.panel.onDidDispose(e => {
            this.onDisposeEmitter.fire();
        });
        this.panel.webview.onDidReceiveMessage(async (e) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                editor = await vscode.window.showTextDocument(this.resource, {
                    viewColumn: vscode_1.ViewColumn.One
                });
            }
            switch (e.command) {
                case 'page-click':
                    const ast = parser.parse(editor.document.getText());
                    const section = ast.find(v => v.label === 'section' && v.text === e.text);
                    if (!section) {
                        return;
                    }
                    const line = section.start.line;
                    const position = new vscode.Position(line - 1, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    break;
                case 'end-click':
                    editor.edit(edit => {
                        const position = new vscode.Position(editor.document.lineCount, 0);
                        const eol = editor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
                        edit.insert(position, [eol, '[', e.text, ']', eol].join(''));
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position));
                    });
                    break;
            }
        });
    }
    static create(resource, sideBySide = true) {
        const panel = vscode.window.createWebviewPanel(UiflowPreview.viewType, 'Preview: ' + path.basename(resource.fsPath), {
            viewColumn: getViewColumn(sideBySide),
            preserveFocus: false
        }, {
            enableScripts: true,
            localResourceRoots: [
                vscode_1.Uri.file(path.join(ctx.extensionPath, 'media'))
            ]
        });
        const preview = new UiflowPreview(resource, panel);
        preview.update(resource);
        return preview;
    }
    reveal(sideBySide = true) {
        this.panel.reveal(getViewColumn(sideBySide));
    }
    async update(resource) {
        if (resource.fsPath !== this.resource.fsPath)
            return;
        if (!this.waiting) {
            this.waiting = true;
            setTimeout(() => {
                this.waiting = false;
            }, 300);
            const doc = await vscode.workspace.openTextDocument(resource);
            const compiler = new compiler_1.Compiler();
            const svg = String(await compiler.compile(resource.fsPath, doc.getText(), 'svg'));
            this.panel.webview.html = this.createHtml(svg);
        }
    }
    createHtml(svg) {
        return `<!DOCTYPE html>
			<html>
				<head>
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src vscode-resource:;">
					<script src="${this.getMediaPath('jquery-3.3.1.min.js')}"></script>
					<script src="${this.getMediaPath('preview.js')}"></script>
				</head>
				<body>
					${svg}
				</body>
			</html>
		`;
    }
    getMediaPath(p) {
        return vscode_1.Uri.file(path.join(ctx.extensionPath, 'media', p)).with({ scheme: 'vscode-resource' }).toString();
    }
}
UiflowPreview.viewType = 'uiflow.preview';


/***/ }),

/***/ 66:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = exports.UiflowReferenceProvider = void 0;
const vscode_1 = __webpack_require__(3);
const parser_1 = __webpack_require__(56);
const mode_1 = __webpack_require__(61);
class UiflowReferenceProvider {
    provideReferences(document, position, context, token) {
        const nodes = (0, parser_1.parse)(document.getText());
        const sectionNode = atSection(position, nodes);
        if (!sectionNode) {
            return Promise.resolve(null);
        }
        const locations = nodes.filter(n => {
            if (n.label === 'direction' && n.text === sectionNode.text) {
                return true;
            }
            return false;
        }).map(directionNode => {
            const start = new vscode_1.Position(directionNode.start.line - 1, directionNode.start.column - 1);
            const end = new vscode_1.Position(directionNode.end.line - 1, directionNode.end.column - 1);
            const range = new vscode_1.Range(start, end);
            const location = new vscode_1.Location(document.uri, range);
            return location;
        });
        return Promise.resolve(locations);
    }
}
exports.UiflowReferenceProvider = UiflowReferenceProvider;
function atSection(position, nodes) {
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
function activate(context) {
    const provider = new UiflowReferenceProvider();
    const registration = vscode_1.languages.registerReferenceProvider(mode_1.selector, provider);
    context.subscriptions.push(registration);
}
exports.activate = activate;


/***/ }),

/***/ 65:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = exports.UiflowRenameProvider = void 0;
const vscode_1 = __webpack_require__(3);
const parser_1 = __webpack_require__(56);
const mode_1 = __webpack_require__(61);
class UiflowRenameProvider {
    provideRenameEdits(document, position, newName, token) {
        const nodes = (0, parser_1.parse)(document.getText());
        const filtered = nodes.filter(n => ['section', 'direction'].indexOf(n.label) >= 0);
        const target = atSectionName(position, filtered);
        if (!target) {
            return Promise.resolve(null);
        }
        const edit = new vscode_1.WorkspaceEdit();
        filtered.filter(n => n.text === target.text).forEach(n => {
            const start = new vscode_1.Position(n.start.line - 1, n.start.column - 1);
            const end = new vscode_1.Position(n.end.line - 1, n.end.column - 1);
            const range = new vscode_1.Range(start, end);
            edit.replace(document.uri, range, newName);
        });
        return Promise.resolve(edit);
    }
}
exports.UiflowRenameProvider = UiflowRenameProvider;
function atSectionName(position, filtered) {
    const column = position.character + 1;
    const line = position.line + 1;
    const result = filtered.find((e) => {
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
function activate(context) {
    const provider = new UiflowRenameProvider();
    const registration = vscode_1.languages.registerRenameProvider(mode_1.selector, provider);
    context.subscriptions.push(registration);
}
exports.activate = activate;


/***/ }),

/***/ 62:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UiflowCompletionItemProvider = exports.activate = void 0;
const vscode = __webpack_require__(3);
const uiflow = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'uiflow'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const mode_1 = __webpack_require__(61);
function activate(context) {
    const provider = new UiflowCompletionItemProvider();
    const registration = vscode.languages.registerCompletionItemProvider(mode_1.selector, provider, ...UiflowCompletionItemProvider.triggerCharacters);
    context.subscriptions.push(registration);
}
exports.activate = activate;
class UiflowCompletionItemProvider {
    provideCompletionItems(document, position, token) {
        const lineText = document.lineAt(position.line);
        if (!lineText.text.substring(0, position.character).match(/=.*=>/)) {
            return [];
        }
        const json = uiflow.parser.parse(document.getText(), '');
        const list = [];
        Object.keys(json).forEach(key => {
            const section = json[key];
            const item = new vscode.CompletionItem(section.name);
            item.kind = vscode.CompletionItemKind.Class;
            list.push(item);
        });
        return list;
    }
}
exports.UiflowCompletionItemProvider = UiflowCompletionItemProvider;
UiflowCompletionItemProvider.triggerCharacters = ['>', ' '];


/***/ }),

/***/ 55:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkUiFlow = void 0;
function checkUiFlow(doc) {
    if (doc.languageId !== 'uiflow')
        return false;
    return ['file', 'untitled'].indexOf(doc.uri.scheme) >= 0;
}
exports.checkUiFlow = checkUiFlow;


/***/ }),

/***/ 3:
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),

/***/ 6:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 2:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const preview_1 = __webpack_require__(1);
const export_1 = __webpack_require__(58);
const outline_1 = __webpack_require__(60);
const suggest_1 = __webpack_require__(62);
const definition_1 = __webpack_require__(63);
const diagnostic_1 = __webpack_require__(64);
const rename_1 = __webpack_require__(65);
const reference_1 = __webpack_require__(66);
const folding_1 = __webpack_require__(67);
function activate(context) {
    (0, preview_1.activate)(context);
    (0, export_1.activate)(context);
    (0, outline_1.activate)(context);
    (0, suggest_1.activate)(context);
    (0, definition_1.activate)(context);
    (0, rename_1.activate)(context);
    (0, reference_1.activate)(context);
    (0, folding_1.activate)(context);
    (0, diagnostic_1.activate)();
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map