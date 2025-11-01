import { SingleFileBuilder } from './single-file-builder';
import { NodeFileSystemAdapter } from './file-system-adapter';
export default function astroSingleFile(config = {}) {
    return {
        name: 'astro-single-file',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                const fs = new NodeFileSystemAdapter();
                const builder = new SingleFileBuilder(fs);
                await builder.build(dir.pathname, config);
            }
        }
    };
}
