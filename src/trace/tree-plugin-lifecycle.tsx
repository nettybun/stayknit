import type { api } from 'sinuous/h';
import type { El } from './ds.js';

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

const add = (addCall: typeof api.add): typeof api.add =>
  (parent: El, value: El, endMark) => {
    console.log ('Lifecycle plugin: api.add()');
    const valueConnectedBeforeAdd = value.isConnected;
    const retAdd = addCall(parent, value, endMark);
    if (parent.isConnected && !valueConnectedBeforeAdd)
      callLifecycleForTree('onAttach', value);
    return retAdd;
  };

const rm = (rmCall: typeof api.rm): typeof api.rm =>
  (parent, start: ChildNode, end) => {
    console.log('Lifecycle plugin: api.rm()');
    if (parent.isConnected) {
      for (let c: ChildNode | null = start; c && c !== end; c = c.nextSibling)
        callLifecycleForTree('onDetach', c);
    }
    return rmCall(parent, start, end);
  };

const tree = {
  onAttach: saveLifecycle('onAttach'),
  onDetach: saveLifecycle('onDetach'),
};

const tracers = { add, rm };

export { LifecycleStackFrameKey }; // Types
export { tree, tracers };
