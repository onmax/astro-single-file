export class CssInliner {
  replaceCss(html: string, cssFilename: string, cssStyles: string): string {
    const reCss = new RegExp(`<link[^>]*? href=".*${cssFilename}"[^>]*?>`)
    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`)
    return inlined
  }
}
