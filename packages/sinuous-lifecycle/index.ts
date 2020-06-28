import type { HyperscriptApi } from 'sinuous/h';
import type { El, Tracers } from 'sinuous-trace';

import { trace } from 'sinuous-trace';

type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

declare module 'sinuous-trace' {
  interface RenderStackFrame {
    lifecycles?: { [k in LifecycleNames]?: () => void }
  }
}

const callLifecycleForTree = (fn: LifecycleNames, root: Node): void => {
  const callRetChildren = (el: El) => {
    const meta = trace.meta.get(el);
    // Terser throws
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    const call = meta && meta.lifecycles && meta.lifecycles[fn];
    if (call) call();
    return trace.tree.get(el);
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
};

let childAlreadyConnected: boolean | undefined = undefined;

function lifecyclePlugin(api: HyperscriptApi, tracers: Tracers): void {
  const { add } = api;
  const { add: { onAttach }, rm: { onDetach } } = tracers;

  // Save state before the tracer runs
  api.add = (parent, child, end) => {
    childAlreadyConnected = (child as Node).isConnected;
    return add(parent, child, end);
  };
  tracers.add.onAttach = (parent, child) => {
    if (parent.isConnected && !childAlreadyConnected)
      callLifecycleForTree('onAttach', child as Node);
    childAlreadyConnected = undefined;
    onAttach(parent, child);
  };

  tracers.rm.onDetach = (parent, child) => {
    if (parent.isConnected) callLifecycleForTree('onDetach', child);
    onDetach(parent, child);
  };
}

export { LifecycleNames }; // Types
export { lifecyclePlugin };
