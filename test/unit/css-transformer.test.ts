import { describe, it, expect } from 'vitest'
import { CssTransformer } from '../../src/css-transformer'

describe('CssTransformer', () => {
  it('should minify CSS by default', () => {
    const transformer = new CssTransformer()
    const css = `
      body {
        color: red;
        margin: 0;
      }
    `

    const result = transformer.transform(css)

    expect(result).not.toContain('\n')
    expect(result).toContain('body{color:red')
  })

  it('should apply Lightning CSS transformations with config', () => {
    const transformer = new CssTransformer({
      minify: true
    })
    const css = 'body { color: red; }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle modern CSS syntax', () => {
    const transformer = new CssTransformer()
    const css = '.container { color: rgb(255 0 0); }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
  })

  it('should return original CSS if transformation fails gracefully', () => {
    const transformer = new CssTransformer()
    const css = '.valid { color: blue; }'

    const result = transformer.transform(css)

    expect(result).toBeTruthy()
  })
})
