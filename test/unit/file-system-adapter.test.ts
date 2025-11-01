import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MockFileSystemAdapter, NodeFileSystemAdapter } from '../../src/file-system-adapter'

describe('nodeFileSystemAdapter', () => {
  it('should read directory contents', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content')

    const files = adapter.readDir(tmpDir)

    expect(files).toContain('file.txt')
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should read file contents', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))
    const filePath = path.join(tmpDir, 'test.txt')
    fs.writeFileSync(filePath, 'hello world')

    const content = adapter.readFile(filePath, 'utf8')

    expect(content).toBe('hello world')
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should write file', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))
    const filePath = path.join(tmpDir, 'write.txt')

    adapter.writeFile(filePath, 'test content')

    expect(fs.readFileSync(filePath, 'utf8')).toBe('test content')
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should delete file', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))
    const filePath = path.join(tmpDir, 'delete.txt')
    fs.writeFileSync(filePath, 'temp')

    adapter.deleteFile(filePath)

    expect(fs.existsSync(filePath)).toBe(false)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should stat file', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))
    const filePath = path.join(tmpDir, 'stat.txt')
    fs.writeFileSync(filePath, 'temp')

    const stats = adapter.stat(filePath)

    expect(stats.isFile()).toBe(true)
    expect(stats.isDirectory()).toBe(false)
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('should remove directory', () => {
    const adapter = new NodeFileSystemAdapter()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'))

    adapter.removeDir(tmpDir)

    expect(fs.existsSync(tmpDir)).toBe(false)
  })
})

describe('mockFileSystemAdapter', () => {
  it('should store and retrieve files in memory', () => {
    const adapter = new MockFileSystemAdapter()

    adapter.writeFile('/test/file.txt', 'content')
    const content = adapter.readFile('/test/file.txt', 'utf8')

    expect(content).toBe('content')
  })

  it('should list directory contents', () => {
    const adapter = new MockFileSystemAdapter()
    adapter.writeFile('/dir/a.txt', 'a')
    adapter.writeFile('/dir/b.txt', 'b')

    const files = adapter.readDir('/dir')

    expect(files).toEqual(['a.txt', 'b.txt'])
  })

  it('should delete files', () => {
    const adapter = new MockFileSystemAdapter()
    adapter.writeFile('/test.txt', 'temp')

    adapter.deleteFile('/test.txt')

    expect(() => adapter.readFile('/test.txt', 'utf8')).toThrow()
  })

  it('should stat files', () => {
    const adapter = new MockFileSystemAdapter()
    adapter.writeFile('/file.txt', 'content')
    adapter.createDir('/dir')

    expect(adapter.stat('/file.txt').isFile()).toBe(true)
    expect(adapter.stat('/dir').isDirectory()).toBe(true)
  })

  it('should remove directories', () => {
    const adapter = new MockFileSystemAdapter()
    adapter.createDir('/testdir')

    adapter.removeDir('/testdir')

    expect(() => adapter.stat('/testdir')).toThrow()
  })
})
