
import type { Tracers } from '../tracers.js';
import type { RenderStackFrame } from '../ds.js';

import { ds } from '../ds.js';

/** Return a pretty printed string for debugging */
const log = (x: unknown, subcall?: boolean): string => {
  if (Array.isArray(x)) {
    if (subcall) return 'Array[...]';
    return x.length <= 3
      ? `Array[${x.map(n => log(n, true)).join(',')}]`
      : `Array[${x.slice(0, 3).map(n => log(n, true)).join(',')},+${x.length - 3}]`;
  }

  if (x instanceof Element || x instanceof DocumentFragment) {
    let str = '';
    const isComp = ds.meta.get(x);
    const isGuard = ds.tree.get(x) && !isComp;
    if (isComp) {
      str = `<${isComp.fn.name}/>`;
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
    const c = Array.from(x.childNodes);
    return c.length <= 3
      ? `${str}[${c.map(n => log(n, true)).join(',')}]`
      : `${str}[${c.slice(0, 3).map(n => log(n, true)).join(',')},+${c.length - 3}]`;
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

let refRSF: RenderStackFrame | undefined = undefined;
const groupEnd = () => console.groupEnd();

function pluginLogs(tracers: Tracers): void {
  tracers.h.onEnter.push(() => {
    refRSF = ds.stack[ds.stack.length - 1];
    const { name } = refRSF.fn;
    console.group(`api.h() 🔶 ${name}`);
  });
  tracers.h.onExit.push(() => {
    const { name } = (refRSF as RenderStackFrame).fn;
    const { el } = (refRSF as RenderStackFrame);

    if (el instanceof Node) {
      // Provide visual in DevTools
      const DATASET_TAG = 'component';
      if (el instanceof HTMLElement)
        el.dataset[DATASET_TAG] = name;
      else el.childNodes.forEach(x => {
        (x as HTMLElement).dataset[DATASET_TAG] = `Fragment::${name}`;
      });
    } else {
      console.log(`${name}: Function was not a component. Skipping`);
    }
    console.log(`${name}: Done. Render data:`, refRSF);
    console.groupEnd();
  });

  tracers.add.onEnter.push((parent, value) => {
    console.group('api.add()');
    console.log(`parent:${log(parent)}, value:${log(value)}`);
  });
  // Doesn't seem possible in a plugin architecture to know this:
  // console.log(`Found adoptive parent ${log(cursor)}`);
  tracers.add.onExit.push(groupEnd);

  tracers.insert.onEnter.push((el, value, endMark, current) => {
    console.group('api.insert()');
    console.log(`el:${log(el)}, value:${log(value)}, current:${log(current)}`);
  });
  tracers.insert.onExit.push(groupEnd);

  tracers.rm.onEnter.push(() => {
    console.group('api.rm()');
  });
  tracers.rm.onExit.push(groupEnd);
}

export { pluginLogs };
