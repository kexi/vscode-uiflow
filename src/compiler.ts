'use strict'

import * as uiflow from 'uiflow'
import * as through2 from 'through2'

export class CompileFormat {
  public static SVG = 'svg'
  public static PNG = 'png'
  public static JSON = 'json'
  public static DOT = 'dot'
}

export class Compiler {
  public buildWithCode(
    fileName: string,
    code: string,
    format: string,
    errorHandler: Function
  ): NodeJS.ReadableStream {
    return uiflow.buildWithCode(
      fileName,
      code.replace(/\r\n/g, '\n'),
      format,
      errorHandler
    )
  }

  public compile(
    fileName: string,
    code: string,
    format: string
  ): Promise<Buffer> {
    let promise = new Promise<Buffer>((resolve, rejected) => {
      let buff: any = []
      let output = through2((chunk: any, enc: string, callback: Function) => {
        buff.push(chunk)
        callback()
      })
      let stream = this.buildWithCode(fileName, code, format, (e: any) => {
        rejected(e)
      })
      stream.pipe(output)
      stream.on('end', () => {
        let all = Buffer.concat(buff)
        resolve(all)
        output.end()
      })
    })
    return promise
  }
}
