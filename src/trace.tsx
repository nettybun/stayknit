import type { h, SinuousApi } from 'sinuous/jsx';

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

// TODO:
// Tree uses Node.closest to search for parents, but this opens a potential for
// data inconsistency - see tree.isComponent. This could be resolved by instead
// walking the DOM via Node.parentNode and testing tree.cInstanceDetails.has()

/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
const DATASET_TAG = 'component';
const DATASET_SELECTOR = `[data-${DATASET_TAG}]`;

type El = (HTMLElement | SVGElement)
        & { dataset?: { [DATASET_TAG]?: ComponentName } & DOMStringMap };

type Component = El;

type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

type LifecycleMethods = {
  [K in LifecycleNames]?: () => void;
}

/** Instance information */
type InstanceDetails = {
  name: ComponentName;
  el: El;
  // TODO: Store parent/child references here? Can't enumerate a WS/WM
  // TODO: Add timing, rerender count, etc
} & LifecycleMethods;

const treeDS = {
  /** Collection area for lifecycle methods set during render */
  cRenderingStack: [] as (LifecycleMethods & { name: ComponentName })[],
  /** Map a given instance (DOM element) to component information */
  cInstanceDetails: new WeakMap<Component, InstanceDetails>(),
  /** Map a component name to all of its instances (DOM elements) */
  cInstances: new Map<ComponentName, WeakSet<Component>>(),
};

const treeLifecycleMethods = {
  /** Lifecycle. Registered by calling within a component render */
  onAttach(callback: () => void) { setLifecycle('onAttach', callback); },
  /** Lifecycle. Registered by calling within a component render */
  onDetach(callback: () => void) { setLifecycle('onDetach', callback); },
};

const setLifecycle = (fn: LifecycleNames, callback: () => void) => {
  const len = tree.cRenderingStack.length;
  if (len === 0)
    throw `tree.cRenderingStack is empty, can't set ${fn} lifecycle`;
  tree.cRenderingStack[len - 1][fn] = callback;
};

// Unlike other functions this doesn't throw since this needs to keep rendering
const wrapReviver = (hCall: typeof h) => {
  const wrap: typeof h = (...args: unknown[]) => {
    const [fn] = args;
    if (typeof fn !== 'function') {
      // @ts-ignore
      return hCall(...args);
    }
    const name = fn.name as ComponentName;
    const data = { name };
    tree.cRenderingStack.push(data);
    // This is where tree.onAttach/tree.onDetach can be called
    // @ts-ignore
    const ret = hCall(...args);

    if (ret instanceof Node) {
      console.log(`${name}: ✅`);
    } else {
      console.log(`${name}: ❌`);
      tree.cRenderingStack.pop();
      return ret;
    }
    // Is component
    const lifecycles = tree.cRenderingStack.pop();
    if (!lifecycles) {
      console.error(`${name}: cRenderingStack pop() was empty`);
      return ret;
    }
    if (lifecycles !== data) {
      console.error(`${name}: cRenderingStack pop() wrong object: ${String(lifecycles)}`);
      return ret;
    }
    // TODO: How is DocumentFragment supported?
    const el = ret as HTMLElement;
    const details: InstanceDetails = { el, ...lifecycles };
    tree.cInstanceDetails.set(el, details);
    el.dataset[DATASET_TAG] = name;
    const instances = tree.cInstances.get(name) ?? new WeakSet<El>();
    tree.cInstances.set(name, instances.add(el));

    console.log(`${name}: Done`);
    return ret;
  };
  return wrap;
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: SinuousApi) => {
  const { h, insert, add, rm } = api;
  const type = (x: unknown) => {
    if (x instanceof HTMLElement || x instanceof SVGElement)
      return `<${x.tagName.toLowerCase()}> w/ ${x.childNodes.length} kids`;

    if (x instanceof DocumentFragment)
      return '[Fragment]';

    if (typeof x === 'undefined')
      return '∅';

    if (typeof x === 'function')
      return '[Function]';

    // Default to [object DataType]
    return `"${String(x)}"`;
  };

  api.h = wrapReviver(h);

  api.insert = function<T>(el: Node, value: T, endMark?: Node, current?: T, startNode?: Node) {
    console.log(`Insert ${type(current)} ➡ ${type(value)}`);
    return insert(el, value, endMark, current, startNode);
  };

  const callLifecycle = (fn: LifecycleNames) =>
    (child: Element) => {
      const lifecycle = tree.cInstanceDetails.get(child as El)?.[fn];
      if (lifecycle) {
        console.log(`${fn}: ${String(child)}`, lifecycle);
        lifecycle();
      }
    };

  const onAttach = callLifecycle('onAttach');
  const onDetach = callLifecycle('onDetach');

  api.add = (parent: El, value: string | El, endMark?: El) => {
    console.log(`${type(parent)}\n    ⬅ ${type(value)}`);
    const el = add(parent, value, endMark);
    // If (parent.isConnected) {
    const nodes = parent.querySelectorAll(DATASET_SELECTOR);
    onAttach(parent);
    nodes.forEach(onAttach);
    // }
    return el;
  };

  api.rm = (parent: El, startNode: El, endMark: El) => {
    // If (parent.isConnected) {
    const nodes = parent.querySelectorAll(DATASET_SELECTOR);
    onDetach(parent);
    nodes.forEach(onDetach);
    // }
    return rm(parent, startNode, endMark);
  };
};

const tree = {
  ...treeDS,
  ...treeLifecycleMethods,
};

export { tree, trace };
// Global
Object.assign(window, { tree });
