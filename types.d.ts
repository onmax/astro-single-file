import type { TransformOptions } from 'lightningcss';
export interface SingleFileConfig {
    minify?: boolean;
    lightningcss?: TransformOptions<{}>;
}
export interface FileSystemAdapter {
    readDir(path: string): string[];
    readFile(path: string, encoding: BufferEncoding): string;
    writeFile(path: string, content: string): void;
    deleteFile(path: string): void;
    stat(path: string): {
        isFile(): boolean;
        isDirectory(): boolean;
    };
    removeDir(path: string): void;
}
export interface FileInfo {
    contents: string;
    path: string;
    fileName: string;
}
