import type { El, PluginAdd, PluginRm } from './ds.js';

import { ds } from './ds.js';
import { log } from './log.js';

type Lifecycle =
  | 'onAttach'
  | 'onDetach'

type LifecycleStackFrameKey = {
  lifecycles: { [k in Lifecycle]?: () => void }
}

const saveLifecycle = (fn: Lifecycle) => (callback: () => void) => {
  ds.stack[ds.stack.length - 1].lifecycles[fn] = callback;
};

const callLifecycleForTree = (fn: Lifecycle, root: Node): void => {
  console.log(`%c${fn}`, 'background: coral');
  let callCount = 0;
  const callRetChildren = (el: El) => {
    const meta = ds.meta.get(el);
    const call = meta?.lifecycles[fn];
    if (call) {
      console.log(`${log(el)}:${fn}`, call);
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
  console.log(`${log(root)}:${fn} had children. Calls: ${callCount}`);
};

// State for addPlugin
let valueAlreadyConnected: boolean | undefined = undefined;

const preAdd: PluginAdd = (parent, value) => {
  valueAlreadyConnected = value.isConnected;
};

const postAdd: PluginAdd = (parent, value) => {
  if (parent.isConnected && !valueAlreadyConnected)
    callLifecycleForTree('onAttach', value);
  valueAlreadyConnected = undefined;
};

const preRm: PluginRm = (parent, start, end) => {
  if (parent.isConnected) {
    for (let c = start; c && c !== end; c = c.nextSibling as El | null)
      callLifecycleForTree('onDetach', c);
  }
};

const tree = {
  onAttach: saveLifecycle('onAttach'),
  onDetach: saveLifecycle('onDetach'),
};

const plugins = { preAdd, postAdd, preRm };

export { LifecycleStackFrameKey }; // Types
export { tree, plugins };
