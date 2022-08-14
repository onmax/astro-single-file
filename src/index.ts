import type { AstroIntegration } from 'astro';
import * as fs from 'fs';
import { minify } from 'html-minifier-terser';

export default function astroSingleFile(): AstroIntegration {
    return {
        name: 'astro-single-file',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                // Find all files in the folder recursively in the build folder
                const folder = dir.pathname
                const files = fs.readdirSync(folder).reduce<string[]>((acc, f) => {
                    const file = `${folder}${f}`
                    if (fs.statSync(file).isFile()) {
                        acc.push(file)
                    } else if (fs.statSync(file).isDirectory()) {
                        acc = acc.concat(fs.readdirSync(file).map(f => `${file}/${f}`))
                    }
                    return acc
                }, [])

                // Get HTML and CSS files only
                function openFiles(fileType: 'html' | 'css') {
                    return files
                        .filter((i) => i.endsWith(`.${fileType}`))
                        .map(path => ({ contents: fs.readFileSync(path, 'utf8'), path, fileName: path.split('/').pop()! }))
                }
                const htmlFiles = openFiles('html')
                const cssAssets = openFiles('css')

                // Replace the reference to the external CSS file to inline CSS
                // FIXME: Not sure if this would work for remote CSS files
                function replaceCss(html: string, cssFilename: string, cssStyles: string) {
                    const reCss = new RegExp(`<link[^>]*? href=".*${cssFilename}"[^>]*?>`)
                    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`)
                    return inlined
                }

                // Loop every HTML file and replace the reference to the external CSS file to inline CSS
                for (const html of htmlFiles) {
                    for (const css of cssAssets) {
                        html.contents = replaceCss(html.contents, css.fileName, css.contents)
                    }
                    fs.writeFileSync(html.path, await minify(html.contents, {
                        collapseWhitespace: true,
                        keepClosingSlash: true,
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        minifyCSS: true,
                    }))
                }

                // Delete CSS files
                for (const { path } of cssAssets) {
                    fs.unlinkSync(path)
                }

                // Delete empty folders if any
                fs.readdirSync(folder).forEach(f => {
                    const file = `${folder}${f}`
                    if (fs.statSync(file).isDirectory() && fs.readdirSync(file).length === 0) {
                        fs.rmdirSync(file)
                    }
                })
            }
        }
    }
}