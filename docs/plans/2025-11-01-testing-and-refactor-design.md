# Testing and Refactor Design

## Overview
Add comprehensive testing (unit + integration) and refactor the integration to be class-based with Lightning CSS for CSS transformation.

## Goals
- Add unit and integration tests using Vitest
- Refactor monolithic function into testable classes
- Add Lightning CSS for CSS transformation/minification
- Set up CI with GitHub Actions
- Adopt patterns from antfu/starter-ts

## Architecture

### Class Structure

**FileSystemAdapter Interface**
```typescript
interface FileSystemAdapter {
  readDir(path: string): string[]
  readFile(path: string): string
  writeFile(path: string, content: string): void
  deleteFile(path: string): void
  stat(path: string): { isFile(): boolean; isDirectory(): boolean }
  removeDir(path: string): void
}
```

**NodeFileSystemAdapter**
- Wraps Node's fs module
- Implements FileSystemAdapter interface
- Used in production

**MockFileSystemAdapter**
- In-memory implementation for unit tests
- Stores files in Map
- No real I/O

**CssTransformer**
- Wraps Lightning CSS
- Takes CSS string + config
- Returns transformed/minified CSS
- Handles autoprefixing, syntax lowering

**CssInliner**
- Pure function for replacing link tags with inline styles
- `replaceCss(html: string, cssFilename: string, cssContent: string): string`
- Current regex logic preserved
- No side effects

**SingleFileBuilder**
- Main orchestrator
- Receives FileSystemAdapter via constructor
- `async build(buildDir: string, config: SingleFileConfig): Promise<void>`

### File Structure
```
src/
  index.ts                  # Entry point, creates integration
  single-file-builder.ts    # Main logic class
  css-transformer.ts        # Lightning CSS wrapper
  css-inliner.ts            # Pure CSS replacement logic
  file-system-adapter.ts    # FS interface + Node implementation
  types.ts                  # Shared types
test/
  unit/
    css-inliner.test.ts
    css-transformer.test.ts
    single-file-builder.test.ts
  integration/
    astro-build.test.ts     # End-to-end with real fs
```

## Configuration

**Interface:**
```typescript
interface SingleFileConfig {
  minify?: boolean  // Default: true
  lightningcss?: import('lightningcss').TransformOptions
}
```

**Example usage:**
```typescript
astroSingleFile({
  minify: true,
  lightningcss: {
    targets: { safari: 13 << 16 },
    drafts: { nesting: true }
  }
})
```

## Processing Flow
1. Find all HTML and CSS files using FileSystemAdapter
2. For each CSS file: Transform with Lightning CSS (autoprefixing, syntax lowering, minification)
3. For each HTML file: Inline transformed CSS using CssInliner
4. Minify HTML with html-minifier-terser (if minify: true)
5. Delete CSS files and empty directories

## Testing Strategy

### Unit Tests
- `css-inliner.test.ts`: Test regex replacement with various HTML structures (single CSS, multiple CSS, no CSS, malformed links)
- `css-transformer.test.ts`: Test Lightning CSS integration, verify transformations
- `single-file-builder.test.ts`: Use MockFileSystemAdapter, verify file operations, HTML/CSS processing order, minification calls

### Integration Tests
- `astro-build.test.ts`: Create real temp directories with sample HTML/CSS files, run full build, verify output
- Use actual NodeFileSystemAdapter
- Test edge cases: nested folders, empty folders cleanup, multiple HTML files

### Test Scripts
```json
"test": "vitest",
"test:unit": "vitest run test/unit",
"test:integration": "vitest run test/integration",
"test:ci": "vitest run"
```

## CI Setup
- GitHub Actions workflow `.github/workflows/test.yml`
- Run on: push, pull_request
- Node versions: 18, 20, 24
- Steps: install deps, run tests, verify build

## Dependencies to Add
- `vitest` - Test framework
- `@vitest/ui` - Test UI (optional)
- `lightningcss` - CSS transformation
- `@types/lightningcss` - TypeScript types

## Adoption from antfu/starter-ts
- Project structure patterns
- Build configuration
- Testing setup conventions
- Package.json scripts organization
