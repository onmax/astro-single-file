import type { FileSystemAdapter, SingleFileConfig } from './types';
export declare class SingleFileBuilder {
    private fs;
    private cssInliner;
    constructor(fs: FileSystemAdapter);
    build(buildDir: string, config: SingleFileConfig): Promise<void>;
    private findAllFiles;
    private openFiles;
}
