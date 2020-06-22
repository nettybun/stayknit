import type { Tracers } from './tracers.js';
import type { El, Tree } from './ds.js';

import { ds } from './ds.js';
import { log } from './log.js';

type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

declare module './ds.js' {
  interface RenderStackFrame {
    lifecycles: { [k in LifecycleNames]?: () => void }
  }
  interface DataStore {
    stack: RenderStackFrame[]
  }
  interface Tree {
    onAttach(callback: () => void): void
    onDetach(callback: () => void): void
  }
}

const lifecyclesRSF = () => ds.stack[ds.stack.length - 1].lifecycles;

const callLifecycleForTree = (fn: LifecycleNames, root: Node): void => {
  console.log(`%c${fn}`, 'background: coral', 'for', root);
  let callCount = 0;
  const callRetChildren = (el: El) => {
    const meta = ds.meta.get(el);
    // FIXME: Terser throws
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    const call = meta && meta.lifecycles[fn];
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

let valueAlreadyConnected: boolean | undefined = undefined;

function pluginLifecycles(tracers: Tracers, tree: Tree): void {
  tracers.h.onEnter.push(
    () => { ds.stack[ds.stack.length - 1].lifecycles = {}; });

  tracers.add.onEnter.push(
    (_, value) => { valueAlreadyConnected = (value as Node).isConnected; });

  tracers.add.onExit.push(
    (parent, value) => {
      if (parent.isConnected && !valueAlreadyConnected)
        callLifecycleForTree('onAttach', value as Node);
      valueAlreadyConnected = undefined;
    }
  );
  tracers.rm.onEnter.push(
    (parent, start: Node | null, end) => {
      if (parent.isConnected)
        for (let c = start; c && c !== end; c = c.nextSibling)
          callLifecycleForTree('onDetach', c);
    }
  );

  tree.onAttach = (callback: () => void) => lifecyclesRSF().onAttach = callback;
  tree.onDetach = (callback: () => void) => lifecyclesRSF().onDetach = callback;
}

export { pluginLifecycles };
