import type { TransformOptions } from 'lightningcss';
export declare class CssTransformer {
    private config?;
    constructor(config?: TransformOptions<{}> | undefined);
    transform(css: string): string;
}
