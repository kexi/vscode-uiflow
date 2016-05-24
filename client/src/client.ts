'use strict';

import path = require('path');
import vscode = require('vscode');
import fs = require('fs');
import { workspace, ExtensionContext} from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';
import { MODE } from './mode';

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	let debugOptions = { execArgv: ['--nolazy', '--debug=6004'] };

	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: MODE.language,
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	let client = new LanguageClient('Uiflow Server Client', serverOptions, clientOptions).start();
	context.subscriptions.push(client);

}
