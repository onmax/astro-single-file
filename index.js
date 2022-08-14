import * as fs from 'fs';
import { minify } from 'html-minifier-terser';
export default function astroSingleFile() {
    return {
        name: 'astro-single-file',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                const folder = dir.pathname;
                const files = fs.readdirSync(folder).reduce((acc, f) => {
                    const file = `${folder}${f}`;
                    if (fs.statSync(file).isFile()) {
                        acc.push(file);
                    }
                    else if (fs.statSync(file).isDirectory()) {
                        acc = acc.concat(fs.readdirSync(file).map(f => `${file}/${f}`));
                    }
                    return acc;
                }, []);
                function openFiles(fileType) {
                    return files
                        .filter((i) => i.endsWith(`.${fileType}`))
                        .map(path => ({ contents: fs.readFileSync(path, 'utf8'), path, fileName: path.split('/').pop() }));
                }
                const htmlFiles = openFiles('html');
                const cssAssets = openFiles('css');
                function replaceCss(html, cssFilename, cssStyles) {
                    const reCss = new RegExp(`<link[^>]*? href=".*${cssFilename}"[^>]*?>`);
                    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`);
                    return inlined;
                }
                for (const html of htmlFiles) {
                    for (const css of cssAssets) {
                        html.contents = replaceCss(html.contents, css.fileName, css.contents);
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
                    }));
                }
                for (const { path } of cssAssets) {
                    fs.unlinkSync(path);
                }
                fs.readdirSync(folder).forEach(f => {
                    const file = `${folder}${f}`;
                    if (fs.statSync(file).isDirectory() && fs.readdirSync(file).length === 0) {
                        fs.rmdirSync(file);
                    }
                });
            }
        }
    };
}
