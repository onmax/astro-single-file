import type { AstroIntegration } from 'astro'
import type { SingleFileConfig } from './types'
import { NodeFileSystemAdapter } from './file-system-adapter'
import { SingleFileBuilder } from './single-file-builder'

export default function astroSingleFile(config: SingleFileConfig = {}): AstroIntegration {
  return {
    name: 'astro-single-file',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const fs = new NodeFileSystemAdapter()
        const builder = new SingleFileBuilder(fs)
        await builder.build(dir.pathname, config)
      },
    },
  }
}
