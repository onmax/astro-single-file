import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeFileSystemAdapter } from '../../src/file-system-adapter'
import { SingleFileBuilder } from '../../src/single-file-builder'

describe('astro Island Support', () => {
  let tmpDir: string
  let adapter: NodeFileSystemAdapter
  let builder: SingleFileBuilder

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-island-test-'))
    adapter = new NodeFileSystemAdapter()
    builder = new SingleFileBuilder(adapter)
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it('should preserve astro-island component-url references', async () => {
    const htmlPath = path.join(tmpDir, 'index.html')
    const cssPath = path.join(tmpDir, 'styles.css')
    const jsPath = path.join(tmpDir, 'Counter.CbyaH9Ow.js')

    // Copy fixtures
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/island.html'),
      htmlPath,
    )
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/styles.css'),
      cssPath,
    )
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/Counter.CbyaH9Ow.js'),
      jsPath,
    )

    await builder.build(tmpDir, {})

    const result = fs.readFileSync(htmlPath, 'utf8')

    // CSS should be inlined
    expect(result).toContain('<style>')
    expect(fs.existsSync(cssPath)).toBe(false)

    // Astro island should be preserved
    expect(result).toContain('<astro-island')
    expect(result).toContain('component-url="/_astro/Counter.CbyaH9Ow.js"')
    expect(result).toContain('renderer-url="/_astro/client.react.BSRV7ZI-.js"')

    // JS file should NOT be deleted (it's referenced by the island)
    expect(fs.existsSync(jsPath)).toBe(true)
  })

  it('should handle pages with both CSS and islands', async () => {
    const htmlPath = path.join(tmpDir, 'app.html')
    const cssPath = path.join(tmpDir, 'app.css')

    fs.writeFileSync(htmlPath, `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div class="container">
    <astro-island
      uid="ABC123"
      component-url="/_astro/MyComponent.js"
      component-export="default"
      renderer-url="/_astro/client.svelte.js"
      props='{}'
    >
      <div>Loading...</div>
    </astro-island>
  </div>
</body>
</html>
    `)
    fs.writeFileSync(cssPath, '.container { max-width: 1200px; }')

    await builder.build(tmpDir, { minify: true })

    const result = fs.readFileSync(htmlPath, 'utf8')

    // Verify CSS inlined
    expect(result).toContain('.container{max-width:1200px')
    expect(result).not.toContain('<link')

    // Verify island preserved with correct attributes
    expect(result).toContain('<astro-island')
    expect(result).toContain('component-url="/_astro/MyComponent.js"')
    expect(result).toContain('component-export="default"')
    expect(result).toContain('renderer-url="/_astro/client.svelte.js"')
  })

  it.skip('should inline JS files referenced by islands (future enhancement)', async () => {
    // This test demonstrates a potential enhancement:
    // Instead of keeping external JS files, we could inline them
    // as base64 or embedded scripts within the island element

    const htmlPath = path.join(tmpDir, 'index.html')
    const jsPath = path.join(tmpDir, 'component.js')

    fs.writeFileSync(htmlPath, `
<html>
<body>
  <astro-island component-url="/component.js"></astro-island>
</body>
</html>
    `)
    fs.writeFileSync(jsPath, 'export default function() { return "Hello" }')

    await builder.build(tmpDir, {})

    // Future: could inline JS as base64
    // const result = fs.readFileSync(htmlPath, 'utf8')
    // expect(result).toContain('data:text/javascript;base64,')

    // For now, just verify JS file is preserved
    expect(fs.existsSync(jsPath)).toBe(true)
  })
})
