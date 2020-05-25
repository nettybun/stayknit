import type { h, Api } from 'sinuous/src';

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

/** Instance information such as lifecycle methods */
type ComponentInstanceData = {
  name: ComponentName;
  /** Undefined while rendering */
  node?: Node;
  onAttach?: () => void;
  onDetach?: () => void;
  // TODO: Timing; Rerender Count;
}

// Relationship in the component tree
// Stores top-level elements only
// Use .closest() or .querySelector() to find components within the DOM
// Fragments are [data-component] marked as "Fragment:<ComponentName>"
const tree = {
  /** Collection area for lifecycle methods set during render */
  cRenderingStack: [] as ComponentInstanceData[],
  /** Map a given instance (DOM node) to component information */
  cInstanceData: new WeakMap<Node, ComponentInstanceData & { node: Node }>(),
  /** Map a component name to all of its instances (DOM nodes) */
  cInstances: new Map<ComponentName, WeakSet<Node>>(),
  /** _cPO.get(Child) => Parent */
  cParentOf: new WeakMap<Node, Node>(),
  /** _cCO.get(Parent) => WS[Child, Child, ...] */
  cChildrenOf: new WeakMap<Node, WeakSet<Node>>(),
  /** Nodes that aren't attached to DOM or have no parent (TODO:) */
  cNoParent: new WeakSet<Node>(),
  /** _cAP(Node) => <body/> (use cIL(Node) => <App/> to see component name) */
  cRootMounts: new WeakMap<Node, Node>(),

  /** New component creation */
  createInstance(componentName: ComponentName, node: Node) {
    const instances = tree.cInstances.get(componentName) || new WeakSet<Node>();
    tree.cInstances.set(componentName, instances.add(node));
    tree.cNoParent.add(node);
  },
  /** Attach components (doesn't have to be passed components) */
  relate(parent: Node, child: Node) {
    // TODO: Resolve nodes to closest component
    tree.cParentOf.set(child, parent);
    const children = tree.cChildrenOf.get(parent) || new WeakSet<Node>();
    tree.cChildrenOf.set(parent, children.add(child));
    tree.cNoParent.delete(child);
  },
  /** Determine attachment (doesn't have to be passed a component) */
  isNodeAttached(node: Node) {
    // TODO: Resolve nodes to closest component
    // If (!node.dataset.component) node = node.closest('[...]')
    // Should trust our cNoParent - if it's in there then false
    // Else, while (node.parentNode)..

    // Ugh. Do I track attachment in ComponentInstanceData? Instead of walking
    // the whole tree...
  },

  /** Lifecycle. Registered by calling within a component render */
  onAttach(callback: () => void) {
    console.log('In tree.onAttach()');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setLifecycle('onAttach', callback);
  },
  /** Lifecycle. Registered by calling within a component render */
  onDetach(callback: () => void) {
    console.log('In tree.onDetach()');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setLifecycle('onDetach', callback);
  },
};

const setLifecycle = (fn: 'onAttach' | 'onDetach', callback: () => void) => {
  const len = tree.cRenderingStack.length;
  if (len === 0) {
    throw new Error(`Tree: cRenderingStack empty. Can't set ${fn} lifecycle`);
  }
  tree.cRenderingStack[len - 1][fn] = callback;
};

const wrapReviver = (hCall: typeof h) => {
  const wrap: typeof h = (...args: unknown[]) => {
    const [fn] = args;
    if (typeof fn !== 'function') {
      // @ts-expect-error
      return hCall(...args);
    }
    console.log(`Discovered ${fn.name}`);
    const name = fn.name as ComponentName;
    const data: ComponentInstanceData = { name };
    tree.cRenderingStack.push(data);
    // This is where tree.onAttach/tree.onDetach can be called
    // @ts-expect-error
    const ret = hCall(...args);

    if (ret instanceof Node) {
      console.log(`${name}: ✅`);
    } else {
      console.log(`${name}: ❌`);
      return ret;
    }
    // Is component
    const lifecycles = tree.cRenderingStack.pop();
    if (lifecycles === undefined || lifecycles !== data) {
      console.error(`${name}: cRenderingStack pop() didn't match object: ${lifecycles}`);
      return ret;
    }
    data.node = ret;
    tree.cInstanceData.set(ret, data as ComponentInstanceData & { node: Node });
    tree.createInstance(name, ret);

    console.log(`${name}: Done`);
    return ret;
  };
  return wrap;
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: Api) => {
  const { h, insert, add } = api;
  let countInserts = 0;
  let countAdds = 0;

  const type = (el: unknown) => {
    if ( el instanceof HTMLElement
      || el instanceof SVGElement ) {
      const className = el.getAttribute('className');
      const classes = className
        ? `.${className.replace(/\s+/g, '.')}`
        : '';
      return `[<${el.tagName.toLowerCase()}${classes} > w/ ${el.childNodes.length} kids]`;
    }
    if (el instanceof DocumentFragment) {
      return '[Fragment]';
    }
    // Default to [object DataType]
    return `"${String(el)}"`;
  };

  api.h = wrapReviver(h);

  api.insert = (...args) => {
    console.log(++countInserts, 'Insert');
    return insert(...args);
  };

  api.add = (parent: Node, value: string | Node, endMark?: Node) => {
    console.log(++countAdds, `${type(parent)}\n    <- ${type(value)}`);
    if (value instanceof Node) {
      tree.relate(parent, value);
    }
    return add(parent, value, endMark);
  };

  // TODO: api.rm to support onDetach()
};

export { tree, trace };
// Global
Object.assign(window, { tree });
