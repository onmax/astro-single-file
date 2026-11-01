import { afterEach, describe, expect, it, vi } from 'vitest'
import { CssTransformer } from '../../src/css-transformer'

describe('cssTransformer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should minify modern CSS by default', () => {
    const transformer = new CssTransformer()
    const css = `
      body {
        color: rgb(255 0 0);
        margin: 0;
      }
    `

    const result = transformer.transform(css)

    expect(result).toBe('body{color:red;margin:0}')
  })

  it('should return original CSS when transformation fails', () => {
    const transformer = new CssTransformer()
    const css = '.broken { color: red; } }'
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = transformer.transform(css)

    expect(result).toBe(css)
  })
})
