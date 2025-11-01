import type { FileSystemAdapter } from './types';
export declare class NodeFileSystemAdapter implements FileSystemAdapter {
    readDir(path: string): string[];
    readFile(path: string, encoding?: BufferEncoding): string;
    writeFile(path: string, content: string): void;
    deleteFile(path: string): void;
    stat(path: string): {
        isFile(): boolean;
        isDirectory(): boolean;
    };
    removeDir(path: string): void;
}
export declare class MockFileSystemAdapter implements FileSystemAdapter {
    private files;
    private dirs;
    createDir(path: string): void;
    readDir(path: string): string[];
    readFile(path: string, _encoding?: BufferEncoding): string;
    writeFile(path: string, content: string): void;
    deleteFile(path: string): void;
    stat(path: string): {
        isFile(): boolean;
        isDirectory(): boolean;
    };
    removeDir(path: string): void;
}
