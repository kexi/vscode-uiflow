'use strict';

import * as uiflow from 'uiflow';
import * as through2 from 'through2';

export enum CompileFormat {
	SVG,
	PNG,
	JSON
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
		case CompileFormat.JSON:
			return 'json';
		default:
			throw new Error('Unknown Format');
	}
}

export interface Section extends Object {
	name: string;
	lines?: number;
}

export interface Meta extends Object {
	[key: string]: Section;
}