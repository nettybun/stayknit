import type { _h, HyperscriptApi } from 'sinuous/h';
import type { Observable } from 'sinuous/observable';

import { type } from './utils.js';
import { hTracer, insertTracer, addTracer } from './tracer.js';

enum ComponentNameBrand { _ = '' }
export type ComponentName = ComponentNameBrand & string;

// Not actually used, only to provide hints in DevTools
/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
export const DATASET_TAG = 'component';

export type El
  = (Element | DocumentFragment)
  & { dataset?: { [DATASET_TAG]?: ComponentName } & DOMStringMap };
export type Component = El;

export type Lifecycle =
  | 'onAttach'
  | 'onDetach'

export type LifecycleRefs = { [k in Lifecycle]?: () => void; }
export type HydrationRefs = { [k in string]?: Observable<unknown>; }

export type InstanceMetadata = {
  name: ComponentName;
  children: Set<El>;
  lifecycles: LifecycleRefs;
  hydrations: HydrationRefs;
  // TODO: Add timing, rerender count, etc
};

const ds = {
  /** Any data set via effects during component render */
  renderStack: [] as { lifecycles: LifecycleRefs, hydrations: HydrationRefs }[],
  /** Non-components with component children. Moved up with each re-parenting */
  guardMeta: new WeakMap<El, { children: Set<Component> }>(),
  /** WeakMap a given instance (DOM element) to component metadata */
  compMeta: new WeakMap<Component, InstanceMetadata>(),
  /** Map a component name to all of its instances (DOM elements) */
  compNames: new Map<ComponentName, WeakSet<Component>>(),
};

const sendLifecycleGenerator = (fn: Lifecycle) => (callback: () => void) => {
  ds.renderStack[ds.renderStack.length - 1].lifecycles[fn] = callback;
};
const sendHydrations = (observables: HydrationRefs): void => {
  ds.renderStack[ds.renderStack.length - 1].hydrations = observables;
};

const tree = {
  onAttach: sendLifecycleGenerator('onAttach'),
  onDetach: sendLifecycleGenerator('onDetach'),
  sendHydrations,
};

const callLifecycleForTree = (fn: Lifecycle, root: Node): void => {
  let callCount = 0;
  const callForEl = (el: El) => {
    const meta = ds.compMeta.get(el);
    // If it's not a component but it could be a guardian element
    if (!meta)
      return ds.guardMeta.get(el);

    const call = meta.lifecycles[fn];
    if (typeof window === 'undefined') {
      console.log(`${type(el)}:${fn} Skipped by SSR`);
      return meta;
    }
    if (call) {
      console.log(`${type(el)}:${fn}`, call);
      callCount++;
      call();
    }
    return meta;
  };
  const meta = callForEl(root as El);
  // If not be a component or a guardian, or have nothing else to do
  if (!meta || meta.children.size === 0) {
    console.log(`${type(root)}:${fn} stopped at root. Calls: ${callCount}`);
    return;
  }
  const childSetStack = [meta.children];
  while (childSetStack.length) {
    (childSetStack.shift() as Set<El>).forEach(el => { // TS bug
      const meta = callForEl(el);
      if (meta && meta.children.size > 0) childSetStack.push(meta.children);
    });
  }
  console.log(`${type(root)}:${fn} had children. Calls: ${callCount}`);
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: HyperscriptApi): void => {
  const { h, insert, add } = api;

  api.h = hTracer(h);
  api.insert = insertTracer(insert);
  api.add = addTracer(add);

  // This is a full reimplementation of api.rm that doesn't need a tracer
  api.rm = (parent: El, startNode: El, endMark: El) => {
    let cursor: ChildNode | null = startNode as ChildNode;
    while (cursor && cursor !== endMark) {
      const next: ChildNode | null = cursor.nextSibling;
      // Is needed in case the child was pulled out the parent before clearing.
      if (parent === cursor.parentNode) {
        if (parent.isConnected && cursor instanceof Element) {
          console.log('%conDetach', 'background: coral');
          callLifecycleForTree('onDetach', cursor);
        }
        parent.removeChild(cursor);
      }
      cursor = next;
    }
  };
};

export { tree, trace, ds, callLifecycleForTree };
// Global
if (typeof window !== 'undefined') {
  Object.assign(window, { tree, trace, ds, callLifecycleForTree });
}
