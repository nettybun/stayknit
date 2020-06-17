import { ds } from './index.js';

/** Return a pretty printed string for debugging */
const type = (x: unknown, subcall?: boolean): string => {
  if (Array.isArray(x))
    return subcall
      ? 'Array[...]'
      : `Array[${x.map(n => type(n, true)).join(', ')}]`;

  if (x instanceof Element || x instanceof DocumentFragment) {
    let str = '';
    const isComp = ds.compMeta.get(x);
    const isGuard = ds.guardMeta.get(x);
    if (isComp) {
      str = `<${isComp.name}/>`;
    } else {
      const elName = x instanceof Element
        ? `<${x.tagName.toLowerCase()}>`
        : '[Fragment]';
      str = isGuard
        ? `Guard${elName}`
        : elName;
    }
    const isAttached = !subcall && typeof window !== 'undefined' && document.body.contains(x);
    if (isAttached) str = `📶${str}`;

    if (subcall || x.childNodes.length === 0) return str;
    return `${str}[${[...x.childNodes].map(n => type(n, true)).join(', ')}]`;
  }
  const str = (s: string) => {
    s = s.trim();
    return s.length <= 10
      ? `"${s}"`
      : `"${s.slice(0, 10)}"+${s.length - 10}`;
  };
  if (x instanceof Text) {
    if (!x.textContent) return '';
    return str(x.textContent);
  }
  if (typeof x === 'undefined')
    return '∅';

  if (typeof x === 'function')
    return '$o' in x
      ? '[Observable]'
      : '[Function]';

  // Try to show a startMark (key is minified)
  const o = x as Record<string, unknown>;
  const k = Object.keys(o);
  if (k.length === 1 && o[k[0]] instanceof Text)
    return '[StartMark]';

  // Default to [object DataType]
  return str(String(x));
};

export { type };
