import type { _h, HyperscriptApi } from 'sinuous/h';
import type { Observable } from 'sinuous/observable';

import { type } from './utils.js';
import { hTracer, insertTracer, addTracer } from './tracerFunctions.js';

enum ComponentNameBrand { _ = '' }
export type ComponentName = ComponentNameBrand & string;

// Not actually used, only to provide hints in DevTools
/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
export const DATASET_TAG = 'component';

export type El
  = (Element | DocumentFragment)
  & { dataset?: { [DATASET_TAG]?: ComponentName } & DOMStringMap };
export type Component = El;

export type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

export type LifecycleMethods = { [K in LifecycleNames]?: () => void; }

export type InstanceMetadata = {
  name: ComponentName;
  children: Set<El>;
  lifecycles: LifecycleMethods;
  hydrations: Record<string, Observable<unknown>>;
  // TODO: Add timing, rerender count, etc
};

const ds = {
  /**
   * Lifecycle methods set during render are stored here. They're bound to their
   * component immediately after, when the function closes */
  renderStack: [] as LifecycleMethods[],
  /**
   * Non-components that have children components. Helps to-be parent components
   * register children. There's only ever one guardian per tree (it's moved) */
  guardMeta: new WeakMap<El, { children: Set<Component> }>(),

  /** WeakMap a given instance (DOM element) to component metadata */
  compMeta: new WeakMap<Component, InstanceMetadata>(),

  /** Map a component name to all of its instances (DOM elements) */
  compNames: new Map<ComponentName, WeakSet<Component>>(),
};

// If ds.renderStack is unexpectedly empty, these will throw
const tree = {
  /** Lifecycle. Setup during component render */
  onAttach(callback: () => void): void {
    console.log('Installing onAttach lifecycle');
    ds.renderStack[ds.renderStack.length - 1].onAttach = callback;
  },
  /** Lifecycle. Setup during component render */
  onDetach(callback: () => void): void {
    console.log('Installing onDetach lifecycle');
    ds.renderStack[ds.renderStack.length - 1].onDetach = callback;
  },
};

const callLifecyclesForTree = (fn: LifecycleNames) =>
  (root: Element | DocumentFragment) => {
    let callCount = 0;
    const callLifecycleForEl = (el: El) => {
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
    const meta = callLifecycleForEl(root as El);
    // If not be a component or a guardian, or have nothing else to do
    if (!meta || meta.children.size === 0) {
      console.log(`${type(root)}:${fn} stopped at root. Calls: ${callCount}`);
      console.log('Meta:', meta);
      return;
    }
    const childSetStack = [meta.children];
    while (childSetStack.length) {
      (childSetStack.shift() as Set<El>).forEach(el => { // TS bug
        const meta = callLifecycleForEl(el);
        if (meta && meta.children.size > 0) childSetStack.push(meta.children);
      });
    }
    console.log(`${type(root)}:${fn} had children. Calls: ${callCount}`);
  };

const callAttachForTree = callLifecyclesForTree('onAttach');
const callDetachForTree = callLifecyclesForTree('onDetach');

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
          callDetachForTree(cursor);
        }
        parent.removeChild(cursor);
      }
      cursor = next;
    }
  };
};

export { tree, trace, ds, callAttachForTree, callDetachForTree };
// Global
if (typeof window !== 'undefined') {
  Object.assign(window, { tree, trace, ds, callAttachForTree, callDetachForTree });
}
