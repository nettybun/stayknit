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
  // TODO: Won't resolve tsconfig.json non-relative imports, but it's a start
  plugin.addResolver({ filter: /\.(ts|js)x?$/ }, args => {
    console.group(`Resolver: ${args.path}`);
    let importee = path.resolve(args.resolveDir, args.path);
    const lookupPaths = [importee];

    // TypeScript files may import '.js' to refer to either '.ts' or '.tsx'
    if (importee.endsWith('.js')) {
      for (const ext of ['ts', 'jsx', 'tsx'])
        lookupPaths.push(importee.replace(/js$/, ext));
    } else {
      for (const ext of ['js', 'ts', 'jsx', 'tsx'])
        lookupPaths.push(`${importee}.${ext}`);
    }
    let code;
    for (const curr of lookupPaths) {
      try {
        code = fs.readFileSync(curr, 'utf-8');
      } catch { /* */ }
      if (code) {
        console.log('Translated', importee, 'as', curr);
        importee = curr;
        break;
      }
    }
    if (!code) {
      throw new Error(`Unresolved import "${importee}"`);
    }

    let match;
    let fileHasMacros;
    while ((match = macroRegex.exec(code))) {
      let [importLine, macroExports, macroModule] = match;
      macroExports = macroExports.replace(/(\s+|{|})/g, '').split(',');
      for (const mExport of macroExports) {
        if (!macros[macroModule]) macros[macroModule] = new Set();
        macros[macroModule].add(mExport);
      }
      fileHasMacros = true;
      console.log(macroModule, macroExports);
    }
    if (!fileHasMacros) {
      console.log('No macros; skipping', args.path);
      console.groupEnd();
      return { path: args.path };
    }

    console.log('Found macros', importee);
    console.groupEnd();
    // Pass the absolute path to the loader; we'll need it later
    return { path: importee, namespace: 'macro' };
  });

  const srcDirRegex = new RegExp(`^${process.cwd()}/src/.+\\.(ts|js)x?$`);
  plugin.addLoader({ filter: srcDirRegex }, args => {
    console.group('Loader');
    console.log(args.path);
    console.groupEnd();
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
