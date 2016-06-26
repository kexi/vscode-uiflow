declare module "uiflow" {
	import uiflow = require('uiflow');
	interface Parser {
		parse(code: string, fileName: string): Meta;
	}
	export function buildWithCode(fileName: string, code: string, format: string, errorHandler: Function): NodeJS.ReadableStream;
	export let parser: Parser;
	export interface Section extends Object {
		name: string;
		lines?: number;
	}
	export interface Meta extends Object {
		[key: string]: Section;
	}
}