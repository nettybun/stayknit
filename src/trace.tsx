import type { h, SinuousApi } from 'sinuous/jsx';

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

// TODO:
// Tree uses Node.closest to search for parents, but this opens a potential for
// data inconsistency - see tree.isComponent. This could be resolved by instead
// walking the DOM via Node.parentNode and testing tree.cInstanceDetails.has()

/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
const DATASET_TAG = 'component';

type El = (HTMLElement | SVGElement)
        & { dataset: { [DATASET_TAG]?: ComponentName } & DOMStringMap };

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
  isDOMBridge: boolean;
  // TODO: Add timing, rerender count, etc
} & LifecycleMethods;

const treeDS = {
  /** Collection area for lifecycle methods set during render */
  cRenderingStack: [] as (LifecycleMethods & { name: ComponentName })[],
  /** Map a given instance (DOM element) to component information */
  cInstanceDetails: new WeakMap<Component, InstanceDetails>(),
  /** Map a component name to all of its instances (DOM elements) */
  cInstances: new Map<ComponentName, WeakSet<Component>>(),

  // There has to be a way to hop between parent/child components. Node.closest
  // works for parents, but Node.querySelector isn't appropriate for children
  // because there's no depth limit - you'll get a flat list of all nested
  // children. Have to store these relationships without walking the DOM:
  /** Child => Parent */
  cParentOf: new WeakMap<Component, Component>(),
  /** Parent => WS[Child, Child, ...] */
  cChildrenOf: new WeakMap<Component, WeakSet<Component>>(),

  /** Elements that don't have a component parent (could have a DOM parent) */
  cEntrypoints: new WeakSet<Component>(),
};

const treeInternalMethods = {

  create(componentName: ComponentName, el: El) {
    el.dataset[DATASET_TAG] = componentName;
    const instances = tree.cInstances.get(componentName) ?? new WeakSet<El>();
    tree.cInstances.set(componentName, instances.add(el));
    tree.cEntrypoints.add(el);
  },

  isComponent(el: El) {
    const inTree = tree.cInstanceDetails.has(el);
    const inElementDataset = DATASET_TAG in el.dataset;
    if (inTree && !inElementDataset) {
      console.warn('Component in cInstanceDetails but wasn\'t tagged', el);
      return false;
    }
    if (!inTree && inElementDataset) {
      console.warn('Component was tagged but wasn\'t in cInstanceDetails', el);
      return false;
    }
    return inTree && inElementDataset;
  },

  isAttached(comp: Component) {
    if (!tree.isComponent(comp))
      throw `Wasn't passed a component: tree.isAttached(${String(comp)}`;
    return document.body.contains(comp);
  },

  relate(parent: Component, child: Component) {
    if (!tree.isComponent(parent) || !tree.isComponent(child))
      throw `Wasn't passed components: tree.relate(${String(parent)}, ${String(child)})`;

    tree.cParentOf.set(child, parent);
    const children = tree.cChildrenOf.get(parent) ?? new WeakSet<El>();
    tree.cChildrenOf.set(parent, children.add(child));
  },

  /** Finds closest component; inclusive */
  nearestParent(el: Component) {
    return tree.isComponent(el)
      ? el
      : el.closest(`[data-${DATASET_TAG}]`) as El;
  },

  /** Find the entrypoint component that is attached to the DOM tree */
  searchForDOMBridge(comp: Component) {
    if (!tree.isComponent(comp))
      throw `Wasn't passed a component: tree.searchForDOMBridge(${String(comp)}`;

    let cur: Component | undefined = comp;
    while (cur) {
      const data = tree.cInstanceDetails.get(cur);
      if (!data)
        throw `cInstanceDetails wasn't defined for ${String(cur)}`;
      if (data.isDOMBridge) {
        if (!tree.cEntrypoints.has(cur))
          throw `isDOMBridge but not in cEntrypoint: ${String(cur)}`;
        return true;
      }

      const compMaybe = tree.cParentOf.get(cur);
      // If at an entrypoint, sanity check (while in development)
      if (!compMaybe && !tree.cEntrypoints.has(cur))
        throw `Top of cParentOf tree wasn't in cEntrypoint: ${String(cur)}`;

      cur = compMaybe;
    }
    return false;
  },
};

const treeLifecycleMethods = {
  /** Lifecycle. Registered by calling within a component render */
  onAttach(callback: () => void) {
    console.log('In tree.onAttach()');
    setLifecycle('onAttach', callback);
  },
  /** Lifecycle. Registered by calling within a component render */
  onDetach(callback: () => void) {
    console.log('In tree.onDetach()');
    setLifecycle('onDetach', callback);
  },
};

const setLifecycle = (fn: LifecycleNames, callback: () => void) => {
  const len = tree.cRenderingStack.length;
  if (len === 0) {
    throw `tree.cRenderingStack is empty, can't set ${fn} lifecycle`;
  }
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
    console.log(`Discovered ${fn.name}`);
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
    const retTyped = ret as HTMLElement;
    const details: InstanceDetails = {
      el: retTyped,
      isDOMBridge: false,
      ...lifecycles,
    };
    tree.cInstanceDetails.set(retTyped, details);
    tree.create(name, retTyped);

    console.log(`${name}: Done`);
    return ret;
  };
  return wrap;
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: SinuousApi) => {
  const { h, insert, add } = api;
  let countInserts = 0;
  let countAdds = 0;

  const type = (el: unknown) => {
    if (el instanceof HTMLElement || el instanceof SVGElement) {
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

  api.add = (parent: El, value: string | El, endMark?: El) => {
    console.log(++countAdds, `${type(parent)}\n    <- ${type(value)}`);
    if (value instanceof Node
     && tree.isComponent(parent)
     && tree.isComponent(value)
    ) {
      tree.relate(parent, value);
    }
    return add(parent, value, endMark);
  };

  // TODO: api.rm to support onDetach()
};

const tree = {
  ...treeDS,
  ...treeInternalMethods,
  ...treeLifecycleMethods,
};

export { tree, trace };
// Global
Object.assign(window, { tree });
