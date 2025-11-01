# astro-single-file

This **[Astro integration][astro-integration]** allows developers to bundle the CSS and HTML in a single file.

- <strong>[Why](#why)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Acknowledgment](#acknowledgment)</strong>

## Why?

Recently, I had to build some HTML emails templates to send to some users where the final bundle is preferable to be in a single file for backend developers. That's why, only CSS and no JS files are being merged in the HTML file. If you would like to support JS files, you are welcome to submit a PR! 

### Installation

#### Automatic installation

Run the following command to install and set it up for you automatically

```sh
astro add astro-single-file # Follow the instructions
```

#### Manual installation
  
The `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
  
```sh
# Using NPM
npx astro add -D astro-single-file
# Using Yarn
yarn astro add -D astro-single-file
# Using PNPM
pnpx astro add -D astro-single-file
```
  
__`astro.config.mjs`__

```js
import astroSingleFile from 'astro-single-file';

export default {
  // ...
  integrations: [astroSingleFile()],
}
```
  
Then, restart the dev server.


## Usage

This integration will after the build process finishes, using `astro:build:done` hook. It will look in the build directory and it will find all the references in your HTML files where it references an external CSS file which it will replace. Then, it will remove those CSS files.

## Configuration

### Basic Usage

```js
import astroSingleFile from 'astro-single-file';

export default {
  integrations: [astroSingleFile()]
}
```

### Configuration Options

```typescript
interface SingleFileConfig {
  /** Enable HTML/CSS minification (default: true) */
  minify?: boolean

  /** Lightning CSS transform options */
  lightningcss?: {
    /** Target browsers for autoprefixing */
    targets?: { [key: string]: number }
    /** Enable CSS drafts (nesting, etc) */
    drafts?: { nesting?: boolean }
    /** Additional Lightning CSS options */
    [key: string]: any
  }
}
```

### Examples

**Disable minification:**
```js
astroSingleFile({ minify: false })
```

**Configure browser targets:**
```js
astroSingleFile({
  lightningcss: {
    targets: {
      safari: 13 << 16,  // Safari 13+
      chrome: 95 << 16   // Chrome 95+
    }
  }
})
```

**Enable CSS nesting:**
```js
astroSingleFile({
  lightningcss: {
    drafts: { nesting: true }
  }
})
``` 

## Troubleshooting

- If your installation doesn't seem to be working, make sure to restart the dev server.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If you edit and save a file and don't see your site update accordingly, try refreshing the page.
- If refreshing the page doesn't update your preview, or if a new installation doesn't seem to be working, then restart the dev server.

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components

## Contributing

This package is maintained by [@onmax](https://github.com/onmax). You're welcome to submit an issue or PR!

## Acknowledgment

Inspired by [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile).
