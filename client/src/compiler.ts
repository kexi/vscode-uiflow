'use strict';

const uiflow = require('uiflow');
const through2 = require('through2');

export enum CompileFormat {
	SVG,
	PNG
}

export class Compiler {
	static buildWithCode(fileName: string, code: string, format: CompileFormat, errorHandler: Function): NodeJS.ReadableStream {
		return uiflow.buildWithCode(fileName, code.replace(/\r\n/g, '\n'), formatToString(format), errorHandler);
	}

	static compile(fileName: string, code: string, format: CompileFormat): Promise<Buffer> {
		let promise = new Promise<Buffer>((resolve, rejected) => {
			let buff = [];
			let output = through2((chunk: any, enc: string, callback: Function) => {
				buff.push(chunk);
				callback();
			});
			let stream = this.buildWithCode(fileName, code, format, (e) => {
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

function formatToString(format: CompileFormat): string {
	switch (format) {
		case CompileFormat.SVG:
			return 'svg';
		case CompileFormat.PNG:
			return 'png';
		default:
			throw new Error('Unknown Format');
	}
}
