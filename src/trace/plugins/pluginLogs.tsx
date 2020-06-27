import type { HyperscriptApi } from 'sinuous/h';
import type { El, Tracers, RenderStackFrame, InstanceMeta } from '../tracers.js';

import { trace } from '../tracers.js';

const inSSR = typeof window === 'undefined';

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
    const isComp = trace.meta.get(x);
    const isGuard = trace.tree.get(x) && !isComp;
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
    const isAttached = !subcall && !inSSR && document.body.contains(x);
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
  const o = x as Record<string, unknown> | null;
  const k = o && Object.keys(o);
  // TS bug...
  if (o && k && k.length === 1 && o[k[0]] instanceof Text)
    return '[StartMark]';

  // Default to [object DataType]
  return str(String(x));
};

let refRSF: RenderStackFrame | undefined;
let initialParentDuringAdd: El | undefined;

function pluginLogs(api: HyperscriptApi, tracers: Tracers): void {
  const { h, add, insert, property, rm } = api;
  const { h: { onCreate }, add: { onAttach }, rm: { onDetach } } = tracers;

  api.h = (fn, ...args) => {
    if (typeof fn === 'function') {
      console.group(`api.h() 🔶 ${fn.name}`);
      // During this h() the tracer will run and save the RSF
      const retH = h(fn, ...args);
      console.log(`${fn.name}: Done. Render data:`, refRSF);
      console.groupEnd();
      return retH;
    }
    return h(fn, ...args);
  };
  tracers.h.onCreate = (_, el) => {
    refRSF = trace.meta.get(el) as InstanceMeta;
    const { name } = refRSF;
    if (el instanceof Node) {
      // Provide visual in DevTools
      const DATASET_TAG = 'component';
      if (el instanceof Element)
        (el as HTMLElement).dataset[DATASET_TAG] = name;
      else el.childNodes.forEach(x => {
        (x as HTMLElement).dataset[DATASET_TAG] = `Fragment::${name}`;
      });
    } else {
      console.log(`${name}: Function was not a component. Skipping`);
    }
    onCreate(_, el);
  };

  api.add = (parent, value, end) => {
    console.group('api.add()');
    console.log(`parent:${log(parent)}, value:${log(value)}`);
    initialParentDuringAdd = parent;
    // During this add() the tracer is called
    const retAdd = add(parent, value, end);
    initialParentDuringAdd = undefined;
    console.groupEnd();
    return retAdd;
  };
  tracers.add.onAttach = (parent, child) => {
    const msg = `Tree attach: ${log(parent)} receives ${log(child)}`;
    console.log(
      parent === initialParentDuringAdd
        ? msg
        : `${msg} (Adoptive parent)`
    );
    onAttach(parent, child);
  };

  api.insert = (el, value, endMark, current) => {
    console.group('api.insert()');
    console.log(`el:${log(el)}, value:${log(value)}, current:${log(current)}`);
    const retInsert = insert(el, value, endMark, current);
    console.groupEnd();
    return retInsert;
  };

  api.property = (el, value, name, ...rest) => {
    console.group('api.property()');
    console.log(`el:${log(el)}, value:${log(value)}, name:${log(name)}`);
    const retProperty = property(el, value, name, ...rest);
    console.groupEnd();
    return retProperty;
  };

  api.rm = (parent, start, endMark) => {
    console.group('api.rm()');
    console.log(`parent:${log(parent)}, start:${log(start)}, endMark:${log(endMark)}`);
    const retRm = rm(parent, start, endMark);
    console.groupEnd();
    return retRm;
  };
  tracers.rm.onDetach = (parent, child) => {
    console.log(`Tree detach: ${log(parent)} unlinks ${log(child)}`);
    onDetach(parent, child);
  };
}

export { pluginLogs };
