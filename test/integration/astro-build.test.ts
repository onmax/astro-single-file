import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeFileSystemAdapter } from '../../src/file-system-adapter'
import { SingleFileBuilder } from '../../src/single-file-builder'

describe('astro Build Integration', () => {
  let tmpDir: string
  let adapter: NodeFileSystemAdapter
  let builder: SingleFileBuilder

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-test-'))
    adapter = new NodeFileSystemAdapter()
    builder = new SingleFileBuilder(adapter)
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it('should inline CSS and minify HTML in real build', async () => {
    const htmlPath = path.join(tmpDir, 'index.html')
    const cssPath = path.join(tmpDir, 'styles.css')

    fs.copyFileSync(
      path.join(__dirname, '../fixtures/sample.html'),
      htmlPath,
    )
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/styles.css'),
      cssPath,
    )

    await builder.build(tmpDir, { minify: true })

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('<style>')
    expect(result).toContain('body{margin:0')
    expect(result).not.toContain('<link')
    expect(fs.existsSync(cssPath)).toBe(false)
  })

  it('should handle multiple HTML files with shared CSS', async () => {
    const page1 = path.join(tmpDir, 'page1.html')
    const page2 = path.join(tmpDir, 'page2.html')
    const cssPath = path.join(tmpDir, 'shared.css')

    fs.writeFileSync(page1, '<html><link rel="stylesheet" href="shared.css"><body>Page 1</body></html>')
    fs.writeFileSync(page2, '<html><link rel="stylesheet" href="shared.css"><body>Page 2</body></html>')
    fs.writeFileSync(cssPath, '.shared { color: blue; }')

    await builder.build(tmpDir, {})

    const html1 = fs.readFileSync(page1, 'utf8')
    const html2 = fs.readFileSync(page2, 'utf8')
    expect(html1).toContain('.shared{color:#00f')
    expect(html2).toContain('.shared{color:#00f')
    expect(fs.existsSync(cssPath)).toBe(false)
  })

  it('should work with nested directories', async () => {
    const subDir = path.join(tmpDir, 'assets')
    fs.mkdirSync(subDir)

    const htmlPath = path.join(subDir, 'page.html')
    const cssPath = path.join(subDir, 'style.css')

    fs.writeFileSync(htmlPath, '<html><link rel="stylesheet" href="style.css"></html>')
    fs.writeFileSync(cssPath, 'body { background: white; }')

    await builder.build(tmpDir, {})

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('body{background:#fff')
    expect(fs.existsSync(cssPath)).toBe(false)
  })

  it('should remove empty directories after cleanup', async () => {
    const emptyDir = path.join(tmpDir, 'empty')
    fs.mkdirSync(emptyDir)

    const htmlPath = path.join(tmpDir, 'index.html')
    fs.writeFileSync(htmlPath, '<html><body>Test</body></html>')

    await builder.build(tmpDir, {})

    expect(fs.existsSync(emptyDir)).toBe(false)
  })

  it('should respect minify: false config', async () => {
    const htmlPath = path.join(tmpDir, 'index.html')
    const cssPath = path.join(tmpDir, 'style.css')

    fs.writeFileSync(htmlPath, `<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Title</h1>
  </body>
</html>`)
    fs.writeFileSync(cssPath, 'h1 { color: red; }')

    await builder.build(tmpDir, { minify: false })

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })

  it('should apply Lightning CSS transformations', async () => {
    const htmlPath = path.join(tmpDir, 'index.html')
    const cssPath = path.join(tmpDir, 'modern.css')

    fs.writeFileSync(htmlPath, '<html><link rel="stylesheet" href="modern.css"></html>')
    fs.writeFileSync(cssPath, '.box { color: rgb(255 0 0); }')

    await builder.build(tmpDir, {
      lightningcss: { minify: true },
    })

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('<style>')
    expect(fs.existsSync(cssPath)).toBe(false)
  })
})
