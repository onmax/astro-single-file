import { transform } from 'lightningcss';
export class CssTransformer {
    constructor(config) {
        this.config = config;
    }
    transform(css) {
        try {
            const result = transform({
                filename: 'input.css',
                code: Buffer.from(css),
                minify: true,
                ...this.config
            });
            return result.code.toString();
        }
        catch (error) {
            console.error('Lightning CSS transformation failed:', error);
            return css;
        }
    }
}
