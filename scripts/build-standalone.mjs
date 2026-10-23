import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const bundle = await build({
  configFile: false,
  root,
  build: {
    write: false,
    minify: true,
    target: 'es2020',
    lib: {
      entry: `${root}src/main.ts`,
      name: 'MidnightApex',
      formats: ['iife'],
    },
  },
})
const outputs = (Array.isArray(bundle) ? bundle : [bundle]).flatMap(result => result.output)
const javascript = outputs.find(output => output.type === 'chunk' && output.isEntry)
const stylesheet = outputs.find(output => output.type === 'asset' && output.fileName.endsWith('.css'))
if (!javascript || !stylesheet) throw new Error('Standalone build needs both JavaScript and CSS.')

// Classic inline JavaScript also runs from file://, unlike external ES modules.
const js = javascript.code.replace(/<\/script/gi, '<\\/script')
const css = String(stylesheet.source).replace(/<\/style/gi, '<\\/style')
const template = await readFile(`${root}src/index.html`, 'utf8')
const license = await readFile(`${root}node_modules/three/LICENSE`, 'utf8')
const html = template
  .replace('</head>', () => `<!-- Three.js license:\n${license}\n-->\n<style>${css}</style>\n</head>`)
  .replace('<script type="module" src="/main.ts"></script>', () => `<script>${js}</script>`)
if (html === template || html.includes('src="/main.ts"')) throw new Error('HTML template could not be bundled.')
await writeFile(`${root}index.html`, html)
await writeFile(`${root}dist/index.html`, html)
console.log('Standalone index.html created: open directly in a WebGL-capable browser.')
