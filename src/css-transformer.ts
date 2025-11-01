import { transform } from 'lightningcss'
import type { TransformOptions } from 'lightningcss'

export class CssTransformer {
  constructor(private config?: TransformOptions) {}

  transform(css: string): string {
    try {
      const result = transform({
        filename: 'input.css',
        code: Buffer.from(css),
        minify: true,
        ...this.config
      })
      return result.code.toString()
    } catch (error) {
      console.error('Lightning CSS transformation failed:', error)
      return css
    }
  }
}
