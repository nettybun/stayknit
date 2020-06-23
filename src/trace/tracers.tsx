import type { api } from 'sinuous/h';
import type { El, RenderStackFrame, InstanceMetadata } from './ds.js';

import { ds } from './ds.js';

type Api = typeof api[keyof Pick<typeof api, 'h' | 'add' | 'insert' | 'rm'>]
type Plugin<T extends Api> = (...args: Parameters<T>) => void
type Tracer<T extends Api, P = Plugin<T>> = { (call: T): T, onEnter: P[], onExit: P[] }

const createTracer = <T extends Api>(fn: (call: T) => T): Tracer<T> => {
  const tfn = fn as Tracer<T>;
  tfn.onEnter = [];
  tfn.onExit = [];
  return tfn;
};
const callPlugins
  = <T extends Api>(plugins: Plugin<T>[], ...args: Parameters<Plugin<T>>) =>
    plugins.forEach(plugin => plugin(...args));

// For sharing fragments between nested h() and add() calls
const refDF: DocumentFragment[] = [];

const h = createTracer<typeof api.h>(hCall =>
  (...args) => {
    const fn = args[0] as () => El;
    if (typeof fn !== 'function') {
      const retH = hCall(...args);
      if (retH instanceof DocumentFragment) refDF.push(retH);
      return retH;
    }
    const { name } = fn;
    const renderData = { fn };
    ds.stack.push(renderData as RenderStackFrame);
    callPlugins(h.onEnter, ...args);
    const el = hCall(...args);
    ds.stack.pop();

    // Not Element or DocumentFragment
    if (!(el instanceof Node)) {
      callPlugins(h.onExit, ...args);
      return el;
    }
    // Elements will already be in the tree if they had any children
    if (!ds.tree.has(el)) ds.tree.set(el, new Set<El>());

    // Register as a component
    ds.meta.set(el, renderData as InstanceMetadata);

    callPlugins(h.onExit, ...args);
    return el;
  });

// Sinuous' api.add isn't purely a subcall of api.h. If given an array, it will
// call api.h again to create a fragment (never returned). To see the fragment
// here, tracer.h sets refDF. It's empty since insertBefore() clears child nodes
const add = createTracer<typeof api.add>(addCall =>
  (parent: El, value: El, endMark) => {
    callPlugins(add.onEnter, parent, value);
    const exit = () => callPlugins(add.onExit, parent, value);

    const ret = addCall(parent, value, endMark);
    if (Array.isArray(value) && refDF.length)
      value = refDF.pop() as DocumentFragment;
    if (!(value instanceof Node)) {
      exit();
      return ret;
    }
    const searchForAdoptiveParent = (children: Set<El>) => {
      let cursor: El | null = parent;
      // eslint-disable-next-line no-cond-assign
      while (cursor = cursor.parentElement) {
        const c = ds.tree.get(cursor);
        if (c) return children.forEach(x => c.add(x));
      }
      // Didn't find a suitable parent walking up tree. Default to <body/>
      const body = ds.tree.get(document.body);
      if (body) children.forEach(x => body.add(x));
      else ds.tree.set(document.body, children);
    };
    const parentChildren = ds.tree.get(parent);
    const valueChildren = ds.tree.get(value);
    // If <Any><-El, no action
    // If inTree<-Comp, parent also guards val
    // If inTree<-Guard, parent also guards val's children and val is no longer a guard
    // If El<-Comp, parent is now a guard of val
    // If El<-Guard, parent is now a guard of val's children and val is no longer a guard
    if (!valueChildren) {
      exit();
      return ret;
    }
    const valueComp = ds.meta.has(value);
    if (parentChildren) {
      if (valueComp)
        parentChildren.add(value);
      else
        valueChildren.forEach(x => parentChildren.add(x));
    } else {
      const children = valueComp ? new Set([value]) : valueChildren;
      if (!parent.parentElement || parent === document.body)
        ds.tree.set(parent, children);
      else
        // Value is being added to a connected tree. Look for a ds.tree parent
        searchForAdoptiveParent(children);
    }
    exit();
    // Delete _after_ attaching. Value wasn't a component
    if (!valueComp) ds.tree.delete(value);
    return ret;
  });

const insert = createTracer<typeof api.insert>(insertCall =>
  (...args) => {
    callPlugins(insert.onEnter, ...args);
    const ret = insertCall(...args);
    callPlugins(insert.onExit, ...args);
    return ret;
  });

const rm = createTracer<typeof api.rm>(rmCall =>
  (parent, start: ChildNode, end) => {
    callPlugins(rm.onEnter, parent, start, end);
    const children = ds.tree.get(parent as El);
    if (children)
      for (let c: ChildNode | null = start; c && c !== end; c = c.nextSibling)
        children.delete(c as El);
    const ret = rmCall(parent, start, end);
    callPlugins(rm.onExit, parent, start, end);
    return ret;
  });

const tracers = { h, add, insert, rm };
type Tracers = typeof tracers;

export { Tracers }; // Types
export { tracers };
