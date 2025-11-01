import type { AstroIntegration } from 'astro'
import { SingleFileBuilder } from './single-file-builder'
import { NodeFileSystemAdapter } from './file-system-adapter'
import type { SingleFileConfig } from './types'

export default function astroSingleFile(config: SingleFileConfig = {}): AstroIntegration {
  return {
    name: 'astro-single-file',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const fs = new NodeFileSystemAdapter()
        const builder = new SingleFileBuilder(fs)
        await builder.build(dir.pathname, config)
      }
    }
  }
}