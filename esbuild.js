// This was/is an attempt at removing code from a file as esbuild processes it
// Treeshaking isn't the right idea though... I'll remove it as part of a TS/JS
// loader instead (hopefully that also catches the entrypoint?)

import * as fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Need to compile with go via make && make platform-neutral
// Then also copy esbuild and npm/lib/* to your node_modules/{bin,lib}
const { build } = require('esbuild');

const macroRegex = /^import (.+) from ['"](.+\.macro)['"];?$/mg;
const macros = new Set();

// Per-macro
const macroResolutions = {
  'styletakeout.macro': {
    'css': '() => {}',
    'injectGlobal': '() => {}',
    '*': 'undefined',
  },
};

const macroPlugin = plugin => {
  plugin.setName('macro');
  plugin.addResolver({ filter: /\.macro$/ }, args => {
    const code = fs.readFileSync(args.importer, 'utf-8');
    let match;
    // eslint-disable-next-line no-cond-assign
    while (match = macroRegex.exec(code)) {
      let [importLine, importWhat, importFrom] = match;
      for (const rm of [/\s+/g, /^{/, /}$/]) {
        importWhat = importWhat.replace(rm, '');
      }
      importWhat = importWhat.split(',');
      importWhat.forEach(what => macros.add(what));
      console.log(importLine, importWhat, importFrom);
    }
    return { path: args.path, namespace: 'macro' };
  });
  plugin.addLoader({ filter: /.*/, namespace: 'macro' }, args => {
    const res = macroResolutions[args.path];
    if (!res) {
      throw new Error(`No import resolution for "${args.path}"`);
    }
    let contents = '';
    macros.forEach(what => {
      contents += `export const ${what} = ${res[what] || res['*']};\n`;
    });
    console.log('Final:');
    console.log(contents);
    return { contents };
  });
};

build({
  entryPoints: ['src/index.tsx'],
  outdir: 'serve/esbuild',
  bundle: true,
  external: [
    'styletakeout.macro',
  ],
  sourcemap: false,
  minify: false,
  format: 'esm',
  plugins: [
    macroPlugin,
  ],
  jsxFactory: 'h',
  jsxFragment: 'h',
}).catch(() => process.exit(1));
