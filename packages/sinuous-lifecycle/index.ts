import type { HyperscriptApi } from 'sinuous/h';
import type { El, Tracers } from 'sinuous-trace';

import { trace } from 'sinuous-trace';

type Lifecycle =
  | 'onAttach'
  | 'onDetach'

type LifecyclePlugin = {
  (api: HyperscriptApi, tracers: Tracers): void
  // This is a separate method to support the log plugin
  callTree(fn: Lifecycle, root: El): void
}

declare module 'sinuous-trace' {
  interface RenderStackFrame {
    lifecycles?: { [k in Lifecycle]?: () => void }
  }
}

let childAlreadyConnected: boolean | undefined = undefined;

const lifecyclePlugin: LifecyclePlugin = (api, tracers) => {
  const { add } = api;
  const { add: { onAttach }, rm: { onDetach } } = tracers;

  // Save state before the tracer runs
  api.add = (parent, child, end) => {
    childAlreadyConnected = (child as Node).isConnected;
    return add(parent, child, end);
  };
  tracers.add.onAttach = (parent, child) => {
    if (parent.isConnected && !childAlreadyConnected)
      lifecyclePlugin.callTree('onAttach', child as Node);
    childAlreadyConnected = undefined;
    onAttach(parent, child);
  };

  tracers.rm.onDetach = (parent, child) => {
    if (parent.isConnected) lifecyclePlugin.callTree('onDetach', child);
    onDetach(parent, child);
  };
};

// Depth-first-traversal of components
lifecyclePlugin.callTree = (fn: Lifecycle, root: Node): void => {
  const meta = trace.meta.get(root as El);
  // Terser throws
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  const call = meta && meta.lifecycles && meta.lifecycles[fn];
  if (call) call();
  const children = trace.tree.get(root as El);
  if (children && children.size > 0)
    children.forEach(c => lifecyclePlugin.callTree(fn, c));
};

export { Lifecycle, LifecyclePlugin }; // Types
export { lifecyclePlugin };
