'use strict'

import uiflow, {ErrorHandler} from '@kexi/uiflow'
import * as through2 from 'through2'
import {Format} from '@kexi/uiflow/dist/cjs/src/app/interfaces'

export class Compiler {
  public buildWithCode(
    fileName: string,
    code: string,
    format: Format,
    errorHandler: ErrorHandler
  ): NodeJS.ReadableStream {
    return uiflow.buildWithCode(
      fileName,
      code.replace(/\r\n/g, '\n'),
      format,
      errorHandler
    )
  }

  public async compile(
    fileName: string,
    code: string,
    format: Format
  ): Promise<Buffer> {
    const promise = new Promise<Buffer>((_resolve, _reject) => {
      const buff: Uint8Array[] = []
      const output = through2((chunk: Uint8Array, enc: string, callback: Function) => {
        buff.push(chunk)
        callback()
      })

      const stream = this.buildWithCode(fileName, code, format, (e: any) => {
        _reject(e)
      })
      stream.pipe(output)
      stream.on('end', () => {
        const all = Buffer.concat(buff)
        _resolve(all)
        output.end()
      })
    })
    return await promise
  }
}
