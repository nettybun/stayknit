import type { _h, api } from 'sinuous/h';
import type { El } from './index.js';

import { ds, callLifecycleForTree } from './index.js';
import { type } from './utils.js';

const refDF: DocumentFragment[] = [];

// FIXME: Try removing these @ts-ignore once the framework file redefine's h()
const hTracer = (hCall: typeof _h.h): typeof _h.h =>
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

    const renderData = { lifecycles: {}, hydrations: {} };
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
// here, hTracer sets refDF. It's empty since insertBefore() clears child nodes
const addTracer = (addCall: typeof api.add): typeof api.add =>
  (parent: El, value: El, endMark) => {
    console.group('api.add()');
    console.log(`parent:${type(parent)}, value:${type(value)}`);

    // Save this value before addCall()
    const valueWasNotPreviouslyConnected = !value.isConnected;
    const retAdd = addCall(parent, value, endMark);

    // @ts-ignore TS bug? Undefined after checking length
    if (Array.isArray(value) && refDF.length) value = refDF.pop();
    if (!(value instanceof Element || value instanceof DocumentFragment)) {
      console.groupEnd();
      return retAdd;
    }

    const maybeAttach = (): void => {
      if (parent.isConnected && valueWasNotPreviouslyConnected)
        callLifecycleForTree('onAttach', value);
    };

    // TODO: This could replace all the if/else below? (c: El | Set<El>) =>
    const walkUpToPlaceChildren = (children: Set<El>) => {
      let cursor: El | null = parent;
      // eslint-disable-next-line no-cond-assign
      while (cursor = cursor.parentElement) {
        const container = ds.tree.get(cursor);
        if (container) {
          console.log(`Found ${type(cursor)}`);
          // If (children instanceof Set) || container.add(children);
          children.forEach(x => container.add(x));
          break;
        }
        // Didn't find a component or guard walking up tree. Default to <body/>
        if (cursor === document.body) {
          ds.tree.set(parent, children);
          break;
        }
      }
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
        walkUpToPlaceChildren(children);
    }
    maybeAttach();
    // Delete _after_ attaching. Value wasn't a component
    if (!valueComp) ds.tree.delete(value);
    console.groupEnd();
    return retAdd;
  };

const insertTracer = (insertCall: typeof api.insert): typeof api.insert =>
  (el, value, endMark, current, startNode) => {
    console.group('api.insert()');
    console.log(`el:${type(el)}, value:${type(value)}, current:${type(current)}`);
    const retInsert = insertCall(el, value, endMark, current, startNode);
    console.groupEnd();
    return retInsert;
  };

const rmTracer = (rmCall: typeof api.rm): typeof api.rm =>
  // TODO: Factor out into tree version (delete) and lifecycle version (detach)
  // One is if (parent.isConnected) {} and other is if (meta) {}
  (parent, start: ChildNode, end) => {
    console.group('api.rm()');
    if (parent.isConnected) {
      const children = ds.tree.get(parent as El);
      for (let c: ChildNode | null = start; c && c !== end; c = c.nextSibling) {
        callLifecycleForTree('onDetach', c);
        if (children) children.delete(c as El);
      }
    }
    const retRm = rmCall(parent, start, end);
    console.groupEnd();
    return retRm;
  };

export { hTracer, addTracer, insertTracer, rmTracer };
