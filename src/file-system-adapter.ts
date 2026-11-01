import type { FileSystemAdapter } from './types'
import * as fs from 'node:fs'

export class NodeFileSystemAdapter implements FileSystemAdapter {
  readDir(path: string): string[] {
    return fs.readdirSync(path)
  }

  readFile(path: string, encoding: BufferEncoding = 'utf8'): string {
    return fs.readFileSync(path, encoding)
  }

  writeFile(path: string, content: string): void {
    fs.writeFileSync(path, content)
  }

  deleteFile(path: string): void {
    fs.unlinkSync(path)
  }

  stat(path: string): { isFile: () => boolean, isDirectory: () => boolean } {
    return fs.statSync(path)
  }

  removeDir(path: string): void {
    fs.rmdirSync(path)
  }
}
