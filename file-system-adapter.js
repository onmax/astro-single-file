import * as fs from 'fs';
export class NodeFileSystemAdapter {
    readDir(path) {
        return fs.readdirSync(path);
    }
    readFile(path, encoding = 'utf8') {
        return fs.readFileSync(path, encoding);
    }
    writeFile(path, content) {
        fs.writeFileSync(path, content);
    }
    deleteFile(path) {
        fs.unlinkSync(path);
    }
    stat(path) {
        return fs.statSync(path);
    }
    removeDir(path) {
        fs.rmdirSync(path);
    }
}
export class MockFileSystemAdapter {
    constructor() {
        this.files = new Map();
        this.dirs = new Set();
    }
    createDir(path) {
        this.dirs.add(path);
    }
    readDir(path) {
        const normalized = path.endsWith('/') ? path : path + '/';
        const items = [];
        for (const filePath of this.files.keys()) {
            if (filePath.startsWith(normalized)) {
                const relative = filePath.slice(normalized.length);
                const fileName = relative.split('/')[0];
                if (fileName && !items.includes(fileName)) {
                    items.push(fileName);
                }
            }
        }
        for (const dirPath of this.dirs) {
            if (dirPath.startsWith(normalized)) {
                const relative = dirPath.slice(normalized.length);
                const dirName = relative.split('/')[0];
                if (dirName && !items.includes(dirName)) {
                    items.push(dirName);
                }
            }
        }
        return items;
    }
    readFile(path, _encoding = 'utf8') {
        const content = this.files.get(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        return content;
    }
    writeFile(path, content) {
        this.files.set(path, content);
    }
    deleteFile(path) {
        if (!this.files.has(path)) {
            throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
        }
        this.files.delete(path);
    }
    stat(path) {
        const isFile = this.files.has(path);
        const isDirectory = this.dirs.has(path);
        if (!isFile && !isDirectory) {
            throw new Error(`Path not found: ${path}`);
        }
        return {
            isFile: () => isFile,
            isDirectory: () => isDirectory
        };
    }
    removeDir(path) {
        this.dirs.delete(path);
    }
}
