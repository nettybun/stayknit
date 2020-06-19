import type { LifecycleStackFrameKey } from './tree-plugin-lifecycle.jsx';
import type { HydrationStackFrameKey } from './tree-plugin-hydration.jsx';

// The tree keeps all connections between components and children. Elements that
// aren't components but have component children must also be kept the tree so
// the component children can be re-parented to a parent component later. All
// components are in the tree, even those with no children.

type El = Element | DocumentFragment

// Modify these to the plugins you want to use. Follow the type errors
type RenderStackFrame =
  & {}
  & LifecycleStackFrameKey
  & HydrationStackFrameKey

// FUTURE: Add timing, rerender count, etc
type InstanceMetadata = { fn: () => El } & RenderStackFrame;

const ds = {
  /** Functions write here during render. Data is moved to ds.meta after */
  stack: [] as RenderStackFrame[],
  /** Tree of all connections (Components+Guards) */
  tree: new WeakMap<El, Set<El>>(),
  /** Component metadata */
  meta: new WeakMap<El, InstanceMetadata>(),
};

const createStackFrame = (): RenderStackFrame => {
  return { hydrations: {}, lifecycles: {} };
};

export { El, InstanceMetadata }; // Types
export { ds, createStackFrame };
