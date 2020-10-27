import * as fs from 'fs';

// Ironically esbuild doesn't support native ESM lol
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');

const importRegex = /^import (.+) from ['"](.+(?:\.|\/)macro)['"];?$/mg;
// Regex is /(?:a|b|c)(?:[`(][\s\S]*?[`)]|(?:\.\w+)*)*/
const makeReplaceRegex = exps => new RegExp(
  `(?:${exps.join('|')})(?:[\`(][\\s\\S]*?[\`)]|(?:\\.\\w+)*)*`, 'g'
);
const snippets = {
  // [macroName: string]: { [macroExport: string]: ExtractedSource[] }
};

const macroPlugin = plugin => {
  plugin.setName('macro');
  plugin.addLoader({ filter: /\.(ts|js)x?$/ }, args => {
    if (args.path.includes('node_modules')) {
      console.log(`${args.path}; library; skipping`);
      return;
    }
    let source = fs.readFileSync(args.path, 'utf-8');
    let match;
    let discovered = [];
    while ((match = importRegex.exec(source))) {
      let [line, exps, name] = match;
      const { index } = match;
      // Remove the import statement
      source = source.slice(0, index) + source.slice(index + line.length + 1);
      exps = exps.replace(/(\s+|{|})/g, '').split(',');
      if (!snippets[name]) {
        snippets[name] = new Set();
      }
      exps.forEach(exp => snippets[name].add(exp));
      source = source.replace(makeReplaceRegex(exps), 'MACRO_REPLACED');
      discovered.push(`${name}: ${exps.join(',')}`);
    }
    if (discovered.length === 0) {
      console.log(`${args.path}; no macros; skipping`);
      return;
    }
    console.log(`${args.path}; removed ${discovered.length}\n  ${discovered.join('\n  ')}`);
    return { contents: source, loader: 'tsx' };
  });
};

// TODO Macros: StripIndent, Preval, JSON-subset-loader, Millisecond-convert

const snowpackPrefixed = new Set();
const snowpackPrefixPlugin = plugin => {
  plugin.setName('snowpack-prefix');
  // Filter /^(?!\.).*/ with negative-lookahead isn't supported in Go
  plugin.addResolver({ filter: /^(?:haptic|sinuous)/ }, args => {
    snowpackPrefixed.add(args.path);
    // Moving to a new namespace is necessary else '/' will resolve the OS root
    return { path: `/web_modules/${args.path}.js`, external: true, namespace: 'snowpack' };
  });
};

build({
  entryPoints: ['src/index.tsx'],
  outdir: 'serve/esbuild',
  bundle: true,
  sourcemap: false,
  minify: false,
  format: 'esm',
  plugins: [
    macroPlugin,
    snowpackPrefixPlugin,
  ],
  // macros: [
  //   'styletakeout.macro',
  // ],
  jsxFactory: 'h',
  jsxFragment: 'h',
})
  .then(() => {
    console.log('Prefixed:', Array.from(snowpackPrefixed).join(', '));
  })
  .catch(() => process.exit(1));
