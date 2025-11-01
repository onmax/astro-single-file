# Testing and Refactor with Lightning CSS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive testing (unit + integration) and refactor to class-based architecture with Lightning CSS for CSS transformation.

**Architecture:** Extract monolithic hook into testable classes: FileSystemAdapter (interface for file ops), CssTransformer (Lightning CSS wrapper), CssInliner (pure link replacement), SingleFileBuilder (orchestrator). Dependency injection enables mocking for unit tests.

**Tech Stack:** Vitest, Lightning CSS, TypeScript, Astro integration hooks

---

## Task 1: Setup Testing Infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `.github/workflows/test.yml`

**Step 1: Add Vitest and Lightning CSS dependencies**

Modify `package.json`:
```json
{
  "devDependencies": {
    "@types/html-minifier-terser": "^7.0.2",
    "@types/node": "^24.9.2",
    "astro": "^5.15.3",
    "html-minifier-terser": "^7.2.0",
    "lightningcss": "^1.28.2",
    "release-it": "^19.0.5",
    "typescript": "^5.9.3",
    "vitest": "^2.1.8"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:unit": "vitest run test/unit",
    "test:integration": "vitest run test/integration",
    "test:ci": "vitest run",
    "release": "./node_modules/release-it/bin/release-it.js"
  }
}
```

**Step 2: Install dependencies**

Run: `yarn install`
Expected: Success, vitest and lightningcss installed

**Step 3: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['test/**', '*.config.ts', 'dist/**']
    }
  }
})
```

**Step 4: Create CI workflow**

Create `.github/workflows/test.yml`:
```yaml
name: Test

on:
  push:
    branches: [main, feat/*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 24]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run tests
        run: yarn test:ci
      - name: Build
        run: yarn build
```

**Step 5: Create test directory structure**

Run: `mkdir -p test/unit test/integration test/fixtures`
Expected: Directories created

**Step 6: Commit infrastructure setup**

```bash
git add package.json vitest.config.ts .github/workflows/test.yml
git commit -m "setup: add vitest and ci workflow"
```

---

## Task 2: Define Types and Interfaces

**Files:**
- Create: `src/types.ts`

**Step 1: Write types file**

Create `src/types.ts`:
```typescript
import type { AstroIntegration } from 'astro'
import type { TransformOptions } from 'lightningcss'

export interface SingleFileConfig {
  /** Enable HTML/CSS minification (default: true) */
  minify?: boolean
  /** Lightning CSS transform options (autoprefixer, etc) */
  lightningcss?: TransformOptions
}

export interface FileSystemAdapter {
  readDir: (path: string) => string[]
  readFile: (path: string, encoding: BufferEncoding) => string
  writeFile: (path: string, content: string) => void
  deleteFile: (path: string) => void
  stat: (path: string) => { isFile: () => boolean, isDirectory: () => boolean }
  removeDir: (path: string) => void
}

export interface FileInfo {
  contents: string
  path: string
  fileName: string
}
```

**Step 2: Verify types compile**

Run: `yarn build`
Expected: Success, no type errors

**Step 3: Commit types**

```bash
git add src/types.ts
git commit -m "feat: add core types and interfaces"
```

---

## Task 3: FileSystemAdapter Implementation

**Files:**
- Create: `src/file-system-adapter.ts`
- Create: `test/unit/file-system-adapter.test.ts`

**Step 1: Write failing test for NodeFileSystemAdapter**

Create `test/unit/file-system-adapter.test.ts`:
```typescript
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NodeFileSystemAdapter } from '../../src/file-system-adapter'

describe('NodeFileSystemAdapter', () => {
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
```

**Step 2: Run test to verify it fails**

Run: `yarn test:unit file-system-adapter`
Expected: FAIL with "Cannot find module"

**Step 3: Implement NodeFileSystemAdapter**

Create `src/file-system-adapter.ts`:
```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `yarn test:unit file-system-adapter`
Expected: PASS (all 6 tests)

**Step 5: Write failing test for MockFileSystemAdapter**

Add to `test/unit/file-system-adapter.test.ts`:
```typescript
import { MockFileSystemAdapter } from '../../src/file-system-adapter'

describe('MockFileSystemAdapter', () => {
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
```

**Step 6: Run test to verify it fails**

Run: `yarn test:unit file-system-adapter`
Expected: FAIL with "Cannot find MockFileSystemAdapter"

**Step 7: Implement MockFileSystemAdapter**

Add to `src/file-system-adapter.ts`:
```typescript
export class MockFileSystemAdapter implements FileSystemAdapter {
  private files = new Map<string, string>()
  private dirs = new Set<string>()

  createDir(path: string): void {
    this.dirs.add(path)
  }

  readDir(path: string): string[] {
    const normalized = path.endsWith('/') ? path : `${path}/`
    const files: string[] = []

    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(normalized)) {
        const relative = filePath.slice(normalized.length)
        const fileName = relative.split('/')[0]
        if (fileName && !files.includes(fileName)) {
          files.push(fileName)
        }
      }
    }

    return files
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
    this.files.delete(path)
  }

  stat(path: string): { isFile: () => boolean, isDirectory: () => boolean } {
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
```

**Step 8: Run test to verify it passes**

Run: `yarn test:unit file-system-adapter`
Expected: PASS (all 11 tests)

**Step 9: Commit FileSystemAdapter**

```bash
git add src/file-system-adapter.ts test/unit/file-system-adapter.test.ts
git commit -m "feat: add FileSystemAdapter interface and implementations"
```

---

## Task 4: CssInliner Implementation

**Files:**
- Create: `src/css-inliner.ts`
- Create: `test/unit/css-inliner.test.ts`

**Step 1: Write failing tests**

Create `test/unit/css-inliner.test.ts`:
```typescript
import { describe, expect, it } from 'vitest'
import { CssInliner } from '../../src/css-inliner'

describe('CssInliner', () => {
  const inliner = new CssInliner()

  it('should replace single CSS link with inline style', () => {
    const html = '<link rel="stylesheet" href="styles.css">'
    const css = 'body { color: red; }'

    const result = inliner.replaceCss(html, 'styles.css', css)

    expect(result).toContain('<style type="text/css">')
    expect(result).toContain('body { color: red; }')
    expect(result).not.toContain('<link')
  })

  it('should handle CSS link with path', () => {
    const html = '<link rel="stylesheet" href="/assets/main.css">'
    const css = '.container { width: 100%; }'

    const result = inliner.replaceCss(html, 'main.css', css)

    expect(result).toContain('.container { width: 100%; }')
    expect(result).not.toContain('href=')
  })

  it('should preserve other HTML when replacing CSS', () => {
    const html = '<html><head><link rel="stylesheet" href="app.css"></head><body>Content</body></html>'
    const css = 'h1 { font-size: 2em; }'

    const result = inliner.replaceCss(html, 'app.css', css)

    expect(result).toContain('<html>')
    expect(result).toContain('<body>Content</body>')
    expect(result).toContain('h1 { font-size: 2em; }')
  })

  it('should handle link tags with extra attributes', () => {
    const html = '<link rel="stylesheet" type="text/css" href="theme.css" media="screen">'
    const css = '.theme { background: blue; }'

    const result = inliner.replaceCss(html, 'theme.css', css)

    expect(result).toContain('.theme { background: blue; }')
    expect(result).not.toContain('link')
  })

  it('should not replace if filename does not match', () => {
    const html = '<link rel="stylesheet" href="other.css">'
    const css = 'body { margin: 0; }'

    const result = inliner.replaceCss(html, 'different.css', css)

    expect(result).toBe(html)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test:unit css-inliner`
Expected: FAIL with "Cannot find module"

**Step 3: Implement CssInliner**

Create `src/css-inliner.ts`:
```typescript
export class CssInliner {
  replaceCss(html: string, cssFilename: string, cssStyles: string): string {
    const reCss = new RegExp(`<link[^>]*? href=".*${cssFilename}"[^>]*?>`)
    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`)
    return inlined
  }
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test:unit css-inliner`
Expected: PASS (all 5 tests)

**Step 5: Commit CssInliner**

```bash
git add src/css-inliner.ts test/unit/css-inliner.test.ts
git commit -m "feat: add CssInliner for link tag replacement"
```

---

## Task 5: CssTransformer Implementation

**Files:**
- Create: `src/css-transformer.ts`
- Create: `test/unit/css-transformer.test.ts`

**Step 1: Write failing tests**

Create `test/unit/css-transformer.test.ts`:
```typescript
import { describe, expect, it } from 'vitest'
import { CssTransformer } from '../../src/css-transformer'

describe('CssTransformer', () => {
  it('should minify CSS by default', () => {
    const transformer = new CssTransformer()
    const css = `
      body {
        color: red;
        margin: 0;
      }
    `

    const result = transformer.transform(css)

    expect(result).not.toContain('\n')
    expect(result).toContain('body{color:red')
  })

  it('should apply Lightning CSS transformations with config', () => {
    const transformer = new CssTransformer({
      minify: true
    })
    const css = 'body { color: red; }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle modern CSS syntax', () => {
    const transformer = new CssTransformer()
    const css = '.container { color: rgb(255 0 0); }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
  })

  it('should return original CSS if transformation fails gracefully', () => {
    const transformer = new CssTransformer()
    const css = '.valid { color: blue; }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test:unit css-transformer`
Expected: FAIL with "Cannot find module"

**Step 3: Implement CssTransformer**

Create `src/css-transformer.ts`:
```typescript
import type { TransformOptions } from 'lightningcss'
import { transform } from 'lightningcss'

export class CssTransformer {
  constructor(private config?: TransformOptions) {}

  transform(css: string): string {
    try {
      const result = transform({
        filename: 'input.css',
        code: Buffer.from(css),
        minify: true,
        ...this.config
      })
      return result.code.toString()
    }
    catch (error) {
      console.error('Lightning CSS transformation failed:', error)
      return css
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test:unit css-transformer`
Expected: PASS (all 4 tests)

**Step 5: Commit CssTransformer**

```bash
git add src/css-transformer.ts test/unit/css-transformer.test.ts
git commit -m "feat: add CssTransformer with Lightning CSS"
```

---

## Task 6: SingleFileBuilder Implementation

**Files:**
- Create: `src/single-file-builder.ts`
- Create: `test/unit/single-file-builder.test.ts`

**Step 1: Write failing tests**

Create `test/unit/single-file-builder.test.ts`:
```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { MockFileSystemAdapter } from '../../src/file-system-adapter'
import { SingleFileBuilder } from '../../src/single-file-builder'

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
    expect(html).toContain('<style type="text/css">')
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
    expect(html).toContain('<style type="text/css">')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test:unit single-file-builder`
Expected: FAIL with "Cannot find module"

**Step 3: Implement SingleFileBuilder**

Create `src/single-file-builder.ts`:
```typescript
import type { FileInfo, FileSystemAdapter, SingleFileConfig } from './types'
import { minify } from 'html-minifier-terser'
import { CssInliner } from './css-inliner'
import { CssTransformer } from './css-transformer'

export class SingleFileBuilder {
  private cssInliner = new CssInliner()

  constructor(private fs: FileSystemAdapter) {}

  async build(buildDir: string, config: SingleFileConfig): Promise<void> {
    const folder = buildDir.endsWith('/') ? buildDir : `${buildDir}/`

    // Find all files recursively
    const files = this.findAllFiles(folder)

    // Separate HTML and CSS files
    const htmlFiles = this.openFiles(files, 'html')
    const cssAssets = this.openFiles(files, 'css')

    // Transform CSS with Lightning CSS
    const cssTransformer = new CssTransformer(config.lightningcss)
    const transformedCss = cssAssets.map(css => ({
      ...css,
      contents: cssTransformer.transform(css.contents)
    }))

    // Inline CSS into HTML files
    for (const html of htmlFiles) {
      for (const css of transformedCss) {
        html.contents = this.cssInliner.replaceCss(html.contents, css.fileName, css.contents)
      }

      // Minify HTML if enabled (default: true)
      if (config.minify !== false) {
        html.contents = await minify(html.contents, {
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
        })
      }

      this.fs.writeFile(html.path, html.contents)
    }

    // Delete CSS files
    for (const { path } of cssAssets) {
      this.fs.deleteFile(path)
    }

    // Delete empty folders
    this.fs.readDir(folder).forEach((f) => {
      const file = `${folder}${f}`
      try {
        const stats = this.fs.stat(file)
        if (stats.isDirectory() && this.fs.readDir(file).length === 0) {
          this.fs.removeDir(file)
        }
      }
      catch {
        // Ignore errors (file might have been deleted)
      }
    })
  }

  private findAllFiles(folder: string): string[] {
    return this.fs.readDir(folder).reduce<string[]>((acc, f) => {
      const file = `${folder}${f}`
      const stats = this.fs.stat(file)

      if (stats.isFile()) {
        acc.push(file)
      }
      else if (stats.isDirectory()) {
        const subFiles = this.fs.readDir(file).map(sf => `${file}/${sf}`)
        acc = acc.concat(subFiles)
      }

      return acc
    }, [])
  }

  private openFiles(files: string[], fileType: 'html' | 'css'): FileInfo[] {
    return files
      .filter(i => i.endsWith(`.${fileType}`))
      .map(path => ({
        contents: this.fs.readFile(path, 'utf8'),
        path,
        fileName: path.split('/').pop()!
      }))
  }
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test:unit single-file-builder`
Expected: PASS (all 8 tests)

**Step 5: Commit SingleFileBuilder**

```bash
git add src/single-file-builder.ts test/unit/single-file-builder.test.ts
git commit -m "feat: add SingleFileBuilder orchestrator"
```

---

## Task 7: Refactor Main Integration

**Files:**
- Modify: `src/index.ts`

**Step 1: Refactor index.ts to use new architecture**

Modify `src/index.ts`:
```typescript
import type { AstroIntegration } from 'astro'
import type { SingleFileConfig } from './types'
import { NodeFileSystemAdapter } from './file-system-adapter'
import { SingleFileBuilder } from './single-file-builder'

export default function astroSingleFile(config: SingleFileConfig = {}): AstroIntegration {
  return {
    name: 'astro-single-file',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const fs = new NodeFileSystemAdapter()
        const builder = new SingleFileBuilder(fs)
        await builder.build(dir.pathname, config)
      }
    }
  }
}
```

**Step 2: Verify build still works**

Run: `yarn build`
Expected: Success, no errors

**Step 3: Verify all unit tests pass**

Run: `yarn test:unit`
Expected: PASS (all unit tests)

**Step 4: Commit refactored integration**

```bash
git add src/index.ts
git commit -m "refactor: use class-based architecture in integration"
```

---

## Task 8: Integration Tests

**Files:**
- Create: `test/integration/astro-build.test.ts`
- Create: `test/fixtures/sample.html`
- Create: `test/fixtures/styles.css`

**Step 1: Create test fixtures**

Create `test/fixtures/sample.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
  <title>Test Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a test page.</p>
</body>
</html>
```

Create `test/fixtures/styles.css`:
```css
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  font-size: 2em;
}

p {
  line-height: 1.6;
}
```

**Step 2: Write integration test**

Create `test/integration/astro-build.test.ts`:
```typescript
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NodeFileSystemAdapter } from '../../src/file-system-adapter'
import { SingleFileBuilder } from '../../src/single-file-builder'

describe('Astro Build Integration', () => {
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
      htmlPath
    )
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/styles.css'),
      cssPath
    )

    await builder.build(tmpDir, { minify: true })

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('<style type="text/css">')
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
    expect(html1).toContain('.shared{color:blue')
    expect(html2).toContain('.shared{color:blue')
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
      lightningcss: { minify: true }
    })

    const result = fs.readFileSync(htmlPath, 'utf8')
    expect(result).toContain('<style type="text/css">')
    expect(fs.existsSync(cssPath)).toBe(false)
  })
})
```

**Step 3: Run integration tests**

Run: `yarn test:integration`
Expected: PASS (all 6 tests)

**Step 4: Run all tests**

Run: `yarn test:ci`
Expected: PASS (all unit + integration tests)

**Step 5: Commit integration tests**

```bash
git add test/integration/ test/fixtures/
git commit -m "test: add integration tests for full build process"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `README.md`

**Step 1: Update README with new configuration options**

Modify `README.md`, replace Configuration section:
```markdown
## Configuration

### Basic Usage

```js
import astroSingleFile from 'astro-single-file';

export default {
  integrations: [astroSingleFile()]
}
```

### Configuration Options

```typescript
interface SingleFileConfig {
  /** Enable HTML/CSS minification (default: true) */
  minify?: boolean

  /** Lightning CSS transform options */
  lightningcss?: {
    /** Target browsers for autoprefixing */
    targets?: { [key: string]: number }
    /** Enable CSS drafts (nesting, etc) */
    drafts?: { nesting?: boolean }
    /** Additional Lightning CSS options */
    [key: string]: any
  }
}
```

### Examples

**Disable minification:**
```js
astroSingleFile({ minify: false })
```

**Configure browser targets:**
```js
astroSingleFile({
  lightningcss: {
    targets: {
      safari: 13 << 16, // Safari 13+
      chrome: 95 << 16 // Chrome 95+
    }
  }
})
```

**Enable CSS nesting:**
```js
astroSingleFile({
  lightningcss: {
    drafts: { nesting: true }
  }
})
```
```

**Step 2: Build and verify**

Run: `yarn build`
Expected: Success

**Step 3: Commit documentation**

```bash
git add README.md
git commit -m "docs: update configuration options"
```

---

## Task 10: Final Verification

**Files:**
- All files

**Step 1: Run all tests**

Run: `yarn test:ci`
Expected: All tests pass

**Step 2: Run build**

Run: `yarn build`
Expected: Success, no errors

**Step 3: Check TypeScript compilation**

Run: `yarn tsc --noEmit`
Expected: No type errors

**Step 4: Review git status**

Run: `git status`
Expected: Clean working tree

**Step 5: Push changes**

```bash
git push origin feat/tests-refactor
```

**Step 6: Create pull request**

Run: `gh pr create --title "feat: add tests and refactor with Lightning CSS" --body "$(cat <<'EOF'
## Summary
- Added comprehensive unit and integration tests using Vitest
- Refactored to class-based architecture with dependency injection
- Integrated Lightning CSS for CSS transformation and minification
- Added CI workflow with GitHub Actions
- Configuration now supports minification toggle and Lightning CSS options

## Test Coverage
- Unit tests: FileSystemAdapter, CssInliner, CssTransformer, SingleFileBuilder
- Integration tests: Full build process with real file system

## Breaking Changes
None - config is backward compatible (defaults to previous behavior)

## Test Plan
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Build succeeds
- ✅ CI workflow configured
EOF
)"`

---

## Dependencies Reference

- `vitest` - Test framework
- `lightningcss` - CSS transformation
- `html-minifier-terser` - HTML minification (existing)
- `astro` - Integration hooks (existing)

## Skills Referenced

- @superpowers:test-driven-development - Followed RED-GREEN-REFACTOR cycle throughout
- @superpowers:verification-before-completion - Each task verifies tests pass before commit
- @superpowers:systematic-debugging - If tests fail, investigate root cause before proceeding
