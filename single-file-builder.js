import { minify } from 'html-minifier-terser';
import { CssInliner } from './css-inliner';
import { CssTransformer } from './css-transformer';
export class SingleFileBuilder {
    constructor(fs) {
        this.fs = fs;
        this.cssInliner = new CssInliner();
    }
    async build(buildDir, config) {
        const folder = buildDir.endsWith('/') ? buildDir : buildDir + '/';
        const files = this.findAllFiles(folder);
        const htmlFiles = this.openFiles(files, 'html');
        const cssAssets = this.openFiles(files, 'css');
        const cssTransformer = new CssTransformer(config.lightningcss);
        const transformedCss = cssAssets.map(css => ({
            ...css,
            contents: cssTransformer.transform(css.contents)
        }));
        for (const html of htmlFiles) {
            for (const css of transformedCss) {
                html.contents = this.cssInliner.replaceCss(html.contents, css.fileName, css.contents);
            }
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
                });
            }
            this.fs.writeFile(html.path, html.contents);
        }
        for (const { path } of cssAssets) {
            this.fs.deleteFile(path);
        }
        this.fs.readDir(folder).forEach(f => {
            const file = `${folder}${f}`;
            try {
                const stats = this.fs.stat(file);
                if (stats.isDirectory() && this.fs.readDir(file).length === 0) {
                    this.fs.removeDir(file);
                }
            }
            catch {
            }
        });
    }
    findAllFiles(folder) {
        return this.fs.readDir(folder).reduce((acc, f) => {
            const file = `${folder}${f}`;
            const stats = this.fs.stat(file);
            if (stats.isFile()) {
                acc.push(file);
            }
            else if (stats.isDirectory()) {
                acc = acc.concat(this.findAllFiles(file + '/'));
            }
            return acc;
        }, []);
    }
    openFiles(files, fileType) {
        return files
            .filter(i => i.endsWith(`.${fileType}`))
            .map(path => ({
            contents: this.fs.readFile(path, 'utf8'),
            path,
            fileName: path.split('/').pop()
        }));
    }
}
