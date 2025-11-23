import * as path from 'path'
import Mocha from 'mocha'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - glob 10 has built-in types but may not be recognized in all contexts
import { glob } from 'glob'

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  })

  const testsRoot = path.resolve(__dirname, '..')

  try {
    const files = await glob('**/**.test.js', { cwd: testsRoot })

    // Add files to the test suite
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)))

    // Run the mocha test
    return new Promise<void>((resolve, reject) => {
      try {
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`))
          } else {
            resolve()
          }
        })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
  } catch (err) {
    console.error(err)
    throw err
  }
}
