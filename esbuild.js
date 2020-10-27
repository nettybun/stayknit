// This was/is an attempt at removing code from a file as esbuild processes it
// Treeshaking isn't the right idea though... I'll remove it as part of a TS/JS
// loader instead (hopefully that also catches the entrypoint?)

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Need to compile with go via make && make platform-neutral
// Then also copy esbuild and npm/lib/* to your node_modules/{bin,lib}
const { build } = require('esbuild');

const macroRegex = /^import (.+) from ['"](.+\.macro)['"];?$/mg;
const macros = {
  // Per macro; "styletakeout.macro": Set<["decl", "css", "injectGlobal"]>
};

const macroPlugin = plugin => {
  plugin.setName('macro');
  plugin.addResolver({ filter: /\.(ts|js)x?$/ }, args => {
    // TODO: Won't resolve tsconfig.json non-relative imports, but it's a start
    if (!args.path.startsWith('./')) {
      // Skip
      return { path: args.path };
    }

    //   const code = fs.readFileSync(args.importer, 'utf-8');
    //   let match;
    //   // eslint-disable-next-line no-cond-assign
    //   while (match = macroRegex.exec(code)) {
    //     let [importLine, macroExports, macroModule] = match;
    //     macroExports = macroExports.replace(/(\s+|{|})/g, '').split(',');
    //     for (const mExport of macroExports) {
    //       if (!macros[macroModule]) macros[macroModule] = new Set();
    //       macros[macroModule].add(mExport);
    //     }
    //     // console.log(args, macroModule, macroExports);
    //   }

    const imported = path.resolve(args.resolveDir, args.path);
    const lookupPaths = [imported];

    // TypeScript files may import '.js' to refer to either '.ts' or '.tsx'
    if (imported.endsWith('.js')) {
      for (const ext of ['ts', 'jsx', 'tsx'])
        lookupPaths.push(imported.replace(/js$/, ext));
    } else {
      for (const ext of ['js', 'ts', 'jsx', 'tsx'])
        lookupPaths.push(`${imported}.${ext}`);
    }
    for (const curr of lookupPaths) {
      let contents;
      try {
        contents = fs.readFileSync(curr, 'utf-8');
      } catch { /* */ }
      if (contents) {
        console.log('Resolved', imported, 'to', curr);
        return { contents, loader: 'tsx' };
      }
    }
    throw new Error(`Unresolved import "${imported}"`);
  });

  plugin.addLoader({ filter: /.*/, namespace: 'macro' }, args => {
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
