import { describe, it, expect, beforeEach } from 'vitest'
import { SingleFileBuilder } from '../../src/single-file-builder'
import { MockFileSystemAdapter } from '../../src/file-system-adapter'

describe('SingleFileBuilder', () => {
  let fs: MockFileSystemAdapter
  let builder: SingleFileBuilder

  beforeEach(() => {
    fs = new MockFileSystemAdapter()
    builder = new SingleFileBuilder(fs)
  })

  it('should find and inline CSS into HTML', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/index.html', '<link rel="stylesheet" href="style.css">')
    fs.writeFile('/build/style.css', 'body { color: red; }')

    await builder.build('/build/', {})

    const html = fs.readFile('/build/index.html', 'utf8')
    expect(html).toContain('<style>')
    expect(html).toContain('body{color:red')
  })

  it('should delete CSS files after inlining', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/index.html', '<link rel="stylesheet" href="app.css">')
    fs.writeFile('/build/app.css', '.app { width: 100%; }')

    await builder.build('/build/', {})

    expect(() => fs.readFile('/build/app.css', 'utf8')).toThrow()
  })

  it('should handle multiple HTML files', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/page1.html', '<link rel="stylesheet" href="common.css">')
    fs.writeFile('/build/page2.html', '<link rel="stylesheet" href="common.css">')
    fs.writeFile('/build/common.css', '.common { padding: 0; }')

    await builder.build('/build/', {})

    const html1 = fs.readFile('/build/page1.html', 'utf8')
    const html2 = fs.readFile('/build/page2.html', 'utf8')
    expect(html1).toContain('.common{padding:0')
    expect(html2).toContain('.common{padding:0')
  })

  it('should minify HTML when minify option is true', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/index.html', `
      <html>
        <head><link rel="stylesheet" href="s.css"></head>
        <body>  <h1>Title</h1>  </body>
      </html>
    `)
    fs.writeFile('/build/s.css', 'h1 { color: blue; }')

    await builder.build('/build/', { minify: true })

    const html = fs.readFile('/build/index.html', 'utf8')
    expect(html).not.toContain('\n      ')
    expect(html).toContain('<html')
  })

  it('should skip minification when minify option is false', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/index.html', '<html>\n  <body></body>\n</html>')
    fs.writeFile('/build/dummy.css', 'body{}')

    await builder.build('/build/', { minify: false })

    const html = fs.readFile('/build/index.html', 'utf8')
    expect(html).toContain('\n')
  })

  it('should handle nested directories', async () => {
    fs.createDir('/build')
    fs.createDir('/build/sub')
    fs.writeFile('/build/sub/page.html', '<link rel="stylesheet" href="sub.css">')
    fs.writeFile('/build/sub/sub.css', '.sub { margin: 0; }')

    await builder.build('/build/', {})

    const html = fs.readFile('/build/sub/page.html', 'utf8')
    expect(html).toContain('.sub{margin:0')
  })

  it('should remove empty directories', async () => {
    fs.createDir('/build')
    fs.createDir('/build/empty')
    fs.writeFile('/build/index.html', '<html></html>')

    await builder.build('/build/', {})

    expect(() => fs.stat('/build/empty')).toThrow()
  })

  it('should pass Lightning CSS config to transformer', async () => {
    fs.createDir('/build')
    fs.writeFile('/build/index.html', '<link rel="stylesheet" href="style.css">')
    fs.writeFile('/build/style.css', 'body { color: rgb(255 0 0); }')

    await builder.build('/build/', {
      lightningcss: { minify: true }
    })

    const html = fs.readFile('/build/index.html', 'utf8')
    expect(html).toContain('<style>')
  })
})
