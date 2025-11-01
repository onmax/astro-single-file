import { describe, it, expect } from 'vitest'
import { CssInliner } from '../../src/css-inliner'

describe('CssInliner', () => {
  const inliner = new CssInliner()

  it('should replace single CSS link with inline style', () => {
    const html = '<link rel="stylesheet" href="styles.css">'
    const css = 'body { color: red; }'

    const result = inliner.replaceCss(html, 'styles.css', css)

    expect(result).toContain('<style type="text/css">')
    expect(result).toContain('body { color: red; }')
    expect(result).not.toContain('<link')
  })

  it('should handle CSS link with path', () => {
    const html = '<link rel="stylesheet" href="/assets/main.css">'
    const css = '.container { width: 100%; }'

    const result = inliner.replaceCss(html, 'main.css', css)

    expect(result).toContain('.container { width: 100%; }')
    expect(result).not.toContain('href=')
  })

  it('should preserve other HTML when replacing CSS', () => {
    const html = '<html><head><link rel="stylesheet" href="app.css"></head><body>Content</body></html>'
    const css = 'h1 { font-size: 2em; }'

    const result = inliner.replaceCss(html, 'app.css', css)

    expect(result).toContain('<html>')
    expect(result).toContain('<body>Content</body>')
    expect(result).toContain('h1 { font-size: 2em; }')
  })

  it('should handle link tags with extra attributes', () => {
    const html = '<link rel="stylesheet" type="text/css" href="theme.css" media="screen">'
    const css = '.theme { background: blue; }'

    const result = inliner.replaceCss(html, 'theme.css', css)

    expect(result).toContain('.theme { background: blue; }')
    expect(result).not.toContain('link')
  })

  it('should not replace if filename does not match', () => {
    const html = '<link rel="stylesheet" href="other.css">'
    const css = 'body { margin: 0; }'

    const result = inliner.replaceCss(html, 'different.css', css)

    expect(result).toBe(html)
  })

  it('should replace multiple link tags with same filename', () => {
    const html = '<link rel="stylesheet" href="shared.css"><div></div><link rel="stylesheet" href="shared.css">'
    const css = 'body { margin: 0; }'

    const result = inliner.replaceCss(html, 'shared.css', css)

    expect(result).not.toContain('<link')
    expect(result).toMatch(/<style type="text\/css">/g)
    const styleCount = (result.match(/<style type="text\/css">/g) || []).length
    expect(styleCount).toBe(2)
  })

  it('should handle filename with dots', () => {
    const html = '<link rel="stylesheet" href="app.min.css">'
    const css = '.app { color: blue; }'

    const result = inliner.replaceCss(html, 'app.min.css', css)

    expect(result).toContain('.app { color: blue; }')
    expect(result).not.toContain('<link')
  })

  it('should replace target CSS when not first link', () => {
    const html = '<link rel="stylesheet" href="vendor.css"><link rel="stylesheet" href="target.css"><link rel="stylesheet" href="other.css">'
    const css = '.target { display: block; }'

    const result = inliner.replaceCss(html, 'target.css', css)

    expect(result).toContain('href="vendor.css"')
    expect(result).toContain('href="other.css"')
    expect(result).not.toContain('target.css')
    expect(result).toContain('.target { display: block; }')
  })
})
