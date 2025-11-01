export class CssInliner {
  replaceCss(html: string, cssFilename: string, cssStyles: string): string {
    const escapedFilename = cssFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const reCss = new RegExp(`<link[^>]*? href="[^"]*${escapedFilename}"[^>]*?>`, 'g')
    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`)
    return inlined
  }
}
