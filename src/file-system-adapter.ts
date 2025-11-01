import * as fs from 'fs'
import type { FileSystemAdapter } from './types'

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

  stat(path: string): { isFile(): boolean; isDirectory(): boolean } {
    return fs.statSync(path)
  }

  removeDir(path: string): void {
    fs.rmdirSync(path)
  }
}

export class MockFileSystemAdapter implements FileSystemAdapter {
  private files = new Map<string, string>()
  private dirs = new Set<string>()

  createDir(path: string): void {
    this.dirs.add(path)
  }

  readDir(path: string): string[] {
    const normalized = path.endsWith('/') ? path : path + '/'
    const items: string[] = []

    // Add files
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(normalized)) {
        const relative = filePath.slice(normalized.length)
        const fileName = relative.split('/')[0]
        if (fileName && !items.includes(fileName)) {
          items.push(fileName)
        }
      }
    }

    // Add directories
    for (const dirPath of this.dirs) {
      if (dirPath.startsWith(normalized)) {
        const relative = dirPath.slice(normalized.length)
        const dirName = relative.split('/')[0]
        if (dirName && !items.includes(dirName)) {
          items.push(dirName)
        }
      }
    }

    return items
  }

  readFile(path: string, _encoding: BufferEncoding = 'utf8'): string {
    const content = this.files.get(path)
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return content
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content)
  }

  deleteFile(path: string): void {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`)
    }
    this.files.delete(path)
  }

  stat(path: string): { isFile(): boolean; isDirectory(): boolean } {
    const isFile = this.files.has(path)
    const isDirectory = this.dirs.has(path)

    if (!isFile && !isDirectory) {
      throw new Error(`Path not found: ${path}`)
    }

    return {
      isFile: () => isFile,
      isDirectory: () => isDirectory
    }
  }

  removeDir(path: string): void {
    this.dirs.delete(path)
  }
}
