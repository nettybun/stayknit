import type { _h, HyperscriptApi } from 'sinuous/h';
import type { Observable } from 'sinuous/observable';

import { type } from './utils.js';
import { hTracer, insertTracer, addTracer, rmTracer } from './tracer.js';

enum ComponentNameBrand { _ = '' }
export type ComponentName = ComponentNameBrand & string;

export type El = Element | DocumentFragment
export type Lifecycle =
  | 'onAttach'
  | 'onDetach'

export type LifecycleRefs = { [k in Lifecycle]?: () => void; }
export type HydrationRefs = { [k in string]?: Observable<unknown>; }

export type InstanceMetadata = {
  // TODO: Memory leak regarding function scope?
  fn: () => El;
  lifecycles: LifecycleRefs;
  hydrations: HydrationRefs;
  // TODO: Add timing, rerender count, etc
};

type RenderStack = { lifecycles: LifecycleRefs, hydrations: HydrationRefs }[];

// The tree keeps all connections between components and children. Elements that
// aren't components but have component children must also be kept the tree so
// the component children can be re-parented to a parent component later on.
// Components that have no children are still in the tree.
const ds = {
  /** Functions write here during render. Data is moved to ds.meta after */
  stack: [] as RenderStack,
  /** Tree of all connections (Components+Guards) */
  tree: new WeakMap<El, Set<El>>(),
  /** Component metadata */
  meta: new WeakMap<El, InstanceMetadata>(),
};

const sendLifecycleGenerator = (fn: Lifecycle) => (callback: () => void) => {
  ds.stack[ds.stack.length - 1].lifecycles[fn] = callback;
};
const sendHydrations = (observables: HydrationRefs): void => {
  ds.stack[ds.stack.length - 1].hydrations = observables;
};

const tree = {
  onAttach: sendLifecycleGenerator('onAttach'),
  onDetach: sendLifecycleGenerator('onDetach'),
  sendHydrations,
};

const callLifecycleForTree = (fn: Lifecycle, root: Node): void => {
  console.log(`%c${fn}`, 'background: coral');
  let callCount = 0;
  const callRetChildren = (el: El) => {
    const meta = ds.meta.get(el);
    const call = meta?.lifecycles[fn];
    if (call) {
      console.log(`${type(el)}:${fn}`, call);
      callCount++;
      call();
    }
    return ds.tree.get(el);
  };
  const set = callRetChildren(root as El);
  if (!set) return;
  const stack = [set];
  while (stack.length > 0) {
    (stack.shift() as Set<El>).forEach(el => {
      const elChildren = callRetChildren(el);
      if (elChildren && elChildren.size > 0) stack.push(elChildren);
    });
  }
  console.log(`${type(root)}:${fn} had children. Calls: ${callCount}`);
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: HyperscriptApi): void => {
  api.h = hTracer(api.h);
  api.insert = insertTracer(api.insert);
  api.add = addTracer(api.add);
  api.rm = rmTracer(api.rm);
};

export { tree, trace, ds, callLifecycleForTree };
