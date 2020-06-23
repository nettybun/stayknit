// Tracer data storage

type El = Element | DocumentFragment | Node
type InstanceMetadata = RenderStackFrame

// Must be interfaces; type doesn't work for module augmentation
interface RenderStackFrame { fn: () => El, el: El }
interface DataStore {
  stack: RenderStackFrame[]
  tree: WeakMap<El, Set<El>>
  meta: WeakMap<El, InstanceMetadata>
}
/** Components can manually call tree methods to store data during render */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Tree {}

const ds: DataStore = {
  /** Functions write here during render. Data is moved to ds.meta after */
  stack: [],
  /** Tree of all connections (Components+Guards) */
  tree: new WeakMap(),
  /** Component metadata */
  meta: new WeakMap(),
};

// Note about ds.tree

// All connections between components and children are kept in ds.tree. Elements
// that aren't components but have children who are must also be in the tree so
// the component children can be re-parented to a parent component later on.
// Every component is in the tree, even those with no children.

export { El, RenderStackFrame, InstanceMetadata, DataStore, Tree }; // Types
export { ds };
