import type { TransformOptions } from 'lightningcss'
import { Buffer } from 'node:buffer'
import { transform } from 'lightningcss'

export class CssTransformer {
  constructor(private config?: TransformOptions<Record<string, never>>) {}

  transform(css: string): string {
    try {
      const result = transform({
        filename: 'input.css',
        code: Buffer.from(css),
        minify: true,
        ...this.config,
      })
      return result.code.toString()
    }
    catch (error) {
      console.error('Lightning CSS transformation failed:', error)
      return css
    }
  }
}
