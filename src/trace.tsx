import type { h, Api } from 'sinuous/src';

// Typescript isn't very strict, I don't use `extend`/`&` because it seems to
// widen types on arrays:

// type X = { x?: string };
// let a: X[] = [];
// let b: X & { a: string } = { a: '' }
// a.push(b); (No error, even though I said only allow { x })

// Possibly related:
// https://mariusschulz.com/blog/weak-type-detection-in-typescript#the-limits-of-weak-type-detection

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

type LifecycleMethods = {
  [K in LifecycleNames]?: () => void;
}

/** Instance information */
type InstanceDetails = {
  name: ComponentName;
  node: Node;
  attached: boolean;
  // TODO: Add timing, rerender count, etc
} & LifecycleMethods;

const tree = {
  /** Collection area for lifecycle methods set during render */
  cRenderingStack: [] as (LifecycleMethods & { name: ComponentName })[],
  /** Map a given instance (DOM node) to component information */
  cInstanceDetails: new WeakMap<Node, InstanceDetails>(),
  /** Map a component name to all of its instances (DOM nodes) */
  cInstances: new Map<ComponentName, WeakSet<Node>>(),
  /** _cPO.get(Child) => Parent */
  cParentOf: new WeakMap<Node, Node>(),
  /** _cCO.get(Parent) => WS[Child, Child, ...] */
  cChildrenOf: new WeakMap<Node, WeakSet<Node>>(),
  /** _cAP(Node) => <body/> (use cIL(Node) => <App/> to see component name) */
  cRootMounts: new WeakMap<Node, Node>(),

  /** New component creation */
  createInstance(componentName: ComponentName, node: Node) {
    const instances = tree.cInstances.get(componentName) ?? new WeakSet<Node>();
    tree.cInstances.set(componentName, instances.add(node));
  },
  /** Attach components (doesn't have to be passed components) */
  relate(parent: Node, child: Node) {
    // TODO: Resolve nodes to closest component
    tree.cParentOf.set(child, parent);
    const children = tree.cChildrenOf.get(parent) ?? new WeakSet<Node>();
    tree.cChildrenOf.set(parent, children.add(child));
  },
  /** Determine attachment (doesn't have to be passed a component) */
  isNodeAttached(node: Element) {
    // Resolve nodes to closest component
    let comp = undefined;
    if (node instanceof HTMLElement || node instanceof SVGElement) {
      comp = node.dataset.component
        ? node as Node
        : node.closest('[data-component]') as Node;
    }
    // Resolution failed, not in any component
    if (!comp) return false;

    let compPrev: Node;
    do {
      const data = tree.cInstanceDetails.get(comp);
      if (!data)
        throw `cPO>cID was ${data}. Should never be falsy`;
      if (data.attached)
        return true;
    // eslint-disable-next-line no-cond-assign
    } while (compPrev = comp, comp = tree.cParentOf.get(comp));

    // Made it this far, is the parent mounted?
    return tree.cRootMounts.has(compPrev);
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

const setLifecycle = (fn: LifecycleNames, callback: () => void) => {
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
    const data = { name };
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
    if (!lifecycles || lifecycles !== data) {
      console.error(`${name}: cRenderingStack pop() didn't match object: ${lifecycles}`);
      return ret;
    }
    const details: InstanceDetails = {
      node: ret,
      attached: false,
      ...lifecycles,
    };
    tree.cInstanceDetails.set(ret, details);
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
