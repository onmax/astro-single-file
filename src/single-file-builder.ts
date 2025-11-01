import type { FileInfo, FileSystemAdapter, SingleFileConfig } from './types'
import * as path from 'node:path'
import { minify } from 'html-minifier-terser'
import { CssInliner } from './css-inliner'
import { CssTransformer } from './css-transformer'

export class SingleFileBuilder {
  private cssInliner = new CssInliner()

  constructor(private fs: FileSystemAdapter) {}

  async build(buildDir: string, config: SingleFileConfig): Promise<void> {
    const folder = buildDir

    // Find all files recursively
    const files = this.findAllFiles(folder)

    // Separate HTML and CSS files
    const htmlFiles = this.openFiles(files, 'html')
    const cssAssets = this.openFiles(files, 'css')

    // Transform CSS with Lightning CSS
    const cssTransformer = new CssTransformer(config.lightningcss)
    const transformedCss = cssAssets.map(css => ({
      ...css,
      contents: cssTransformer.transform(css.contents),
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
      const file = path.join(folder, f)
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
      const file = path.join(folder, f)
      const stats = this.fs.stat(file)

      if (stats.isFile()) {
        acc.push(file)
      }
      else if (stats.isDirectory()) {
        acc = acc.concat(this.findAllFiles(file))
      }

      return acc
    }, [])
  }

  private openFiles(files: string[], fileType: 'html' | 'css'): FileInfo[] {
    return files
      .filter(i => i.endsWith(`.${fileType}`))
      .map(filePath => ({
        contents: this.fs.readFile(filePath, 'utf8'),
        path: filePath,
        fileName: path.basename(filePath),
      }))
  }
}
