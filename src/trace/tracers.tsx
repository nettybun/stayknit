import type { _h, api } from 'sinuous/h';
import type { El, Plugin, PluginAdd, PluginRm } from './ds.js';

import { ds, createStackFrame } from './ds.js';
import { log } from './log.js';

type Wrapper<T> = { (call: T): T }
type PluggableWrapper<T, P> = Wrapper<T> & { pre?: P[]; post?: P[] }

const callPlugins = <P extends Plugin>(plugins?: P[], ...args: Parameters<P>) => {
  // @ts-ignore ...args "Expected 3 arguments but got 0 or more"?
  if (plugins) plugins.forEach(plugin => plugin(...args));
};
const refDF: DocumentFragment[] = [];

const h: Wrapper<typeof _h.h> = hCall =>
  // @ts-ignore DocumentFragment is not assignable to SVGElement | HTMLElement
  (...args: unknown[]) => {
    const fn = args[0] as () => El;
    if (typeof fn !== 'function') {
      // @ts-ignore TS doesn't understand ...args
      const retH = hCall(...args);
      if (retH instanceof DocumentFragment) refDF.push(retH);
      return retH;
    }
    const { name } = fn;
    console.group(`🔶 ${name}`);

    const renderData = createStackFrame();
    ds.stack.push(renderData);
    // @ts-ignore TS bug? Destructs overload as `&` not `|`
    const el: HTMLElement | SVGElement | DocumentFragment = hCall(...args);
    ds.stack.pop();

    // Not Element or DocumentFragment
    if (!(el instanceof Node)) {
      console.log(`${name}: Function but not component ❌`);
      console.groupEnd();
      return el;
    }

    // Elements will already be in the tree if they had any children
    if (!ds.tree.has(el)) ds.tree.set(el, new Set<El>());

    // Register as a component
    ds.meta.set(el, { fn, ...renderData });

    // Provide visual in DevTools
    const DATASET_TAG = 'component';
    if (el instanceof Element) el.dataset[DATASET_TAG] = name;
    else el.childNodes.forEach(x => { (x as HTMLElement).dataset[DATASET_TAG] = name; });

    console.log(`${name}: Done. Render data:`, renderData);
    console.groupEnd();
    return el;
  };

// Sinuous' api.add isn't purely a subcall of api.h. If given an array, it will
// call api.h again to create a fragment (never returned). To see the fragment
// here, tracer.h sets refDF. It's empty since insertBefore() clears child nodes
const add: PluggableWrapper<typeof api.add, PluginAdd> = addCall =>
  (parent: El, value: El, endMark) => {
    console.group('api.add()');
    console.log(`parent:${log(parent)}, value:${log(value)}`);
    callPlugins(add.pre, parent, value);
    const retAdd = addCall(parent, value, endMark);

    // @ts-ignore TS bug? Undefined after checking length
    if (Array.isArray(value) && refDF.length) value = refDF.pop();
    if (!(value instanceof Node)) {
      console.groupEnd();
      return retAdd;
    }

    const searchForAdoptiveParent = (children: Set<El>) => {
      let cursor: El | null = parent;
      // eslint-disable-next-line no-cond-assign
      while (cursor = cursor.parentElement) {
        const c = ds.tree.get(cursor);
        if (!c) continue;
        console.log(`Found adoptive parent ${log(cursor)}`);
        children.forEach(x => c.add(x));
        return;
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

    // No action case, value is not in ds.tree
    if (!valueChildren) {
      console.groupEnd();
      return retAdd;
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
    callPlugins(add.post, parent, value);
    // Delete _after_ attaching. Value wasn't a component
    if (!valueComp) ds.tree.delete(value);
    console.groupEnd();
    return retAdd;
  };

const insert: Wrapper<typeof api.insert> = insertCall =>
  (el, value, endMark, current, startNode) => {
    console.group('api.insert()');
    console.log(`el:${log(el)}, value:${log(value)}, current:${log(current)}`);
    const retInsert = insertCall(el, value, endMark, current, startNode);
    console.groupEnd();
    return retInsert;
  };

const rm: PluggableWrapper<typeof api.rm, PluginRm> = rmCall =>
  (parent, start: ChildNode, end) => {
    console.group('api.rm()');
    callPlugins(rm.pre, parent, start, end);
    const children = ds.tree.get(parent as El);
    if (children) {
      for (let c: ChildNode | null = start; c && c !== end; c = c.nextSibling)
        children.delete(c as El);
    }
    const retRm = rmCall(parent, start, end);
    callPlugins(rm.post, parent, start, end);
    console.groupEnd();
    return retRm;
  };

const tracers = { h, add, insert, rm };
export { tracers };
