// Adapted from Snowpack's Babel plugin

// Browsers require ES modules to have the correct MIME type from the server,
// and without an extension can be served incorrectly.

// Originally had this in package.json, but doesn't run on hotreload
// "ts:babel": "babel src --out-dir build --extensions \".tsx\" --source-maps",
// "ts:import-patch": "find build -name '*.js' -exec sed -i '/^import.*\\.js\";/ ! s/\\(^import.*\\)\";/\\1.js\";/' {} \\;",
// "build:ts": "run-s ts:babel ts:import-patch",

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

function rewriteImport(imp) {
  const isSourceImport = imp.startsWith('/') || imp.startsWith('.') || imp.startsWith('\\');
  if (isSourceImport && !path.extname(imp)) {
    return `${imp}.js`;
  }
  return imp;
}

module.exports = function importExtPatch({ types: t, env }) {
  return {
    visitor: {
      CallExpression(path, { file, opts }) {
        if (path.node.callee.type !== 'Import') {
          return;
        }
        const [source] = path.get('arguments');
        if (source.type !== 'StringLiteral') {
          /* Should never happen */
          return;
        }
        source.replaceWith(t.stringLiteral(rewriteImport(source.node.value)));
      },
      'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(path, { file, opts }) {
        const source = path.get('source');
        // An export without a 'from' clause
        if (!source.node) {
          return;
        }
        source.replaceWith(t.stringLiteral(rewriteImport(source.node.value)));
      },
    },
  };
};
