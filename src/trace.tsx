import type { h, SinuousApi } from 'sinuous/jsx';

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

// Not actually used, only to provide hints in DevTools
/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
const DATASET_TAG = 'component';

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
type InstanceMetadata = {
  name: ComponentName;
  el: El;
  children: Set<El>;
  lifecycles: LifecycleMethods;
  // TODO: Add timing, rerender count, etc
};

const ds = {
  /**
   * Lifecycle methods set during render are stored here. They're bound to their
   * component immediately after, when the function closes */
  renderStack: [] as LifecycleMethods[],
  /**
   * Non-component elements that contain components as children are marked as
   * guardians tell any future parent components of their existance. This marker
   * is moved to every new non-component parent until a component is hit */
  guardianNodes: new WeakMap<El, { children: Set<Component> }>(),

  /** WeakMap a given instance (DOM element) to component metadata */
  instanceMetadata: new WeakMap<Component, InstanceMetadata>(),

  /** Map a component name to all of its instances (DOM elements) */
  componentNames: new Map<ComponentName, WeakSet<Component>>(),
};

const tree = {
  /** Lifecycle. Registered by calling within a component render */
  onAttach(callback: () => void) {
    console.log('Running onAttach lifecycle hook');
    setLifecycle('onAttach', callback);
  },
  /** Lifecycle. Registered by calling within a component render */
  onDetach(callback: () => void) {
    console.log('Running onDetach lifecycle hook');
    setLifecycle('onDetach', callback);
  },
};

const setLifecycle = (fn: LifecycleNames, callback: () => void) => {
  const len = ds.renderStack.length;
  if (len === 0)
    throw `ds.renderStack is unexpectedly empty, can't set ${fn} lifecycle`;
  ds.renderStack[len - 1][fn] = callback;
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
    console.group(`${name}`);
    const data = {};
    ds.renderStack.push(data);
    // This is when tree.onAttach/tree.onDetach can be called
    // @ts-ignore
    const ret = hCall(...args);

    if (ret instanceof Node) {
      console.log(`${name}: ✅`);
    } else {
      console.log(`${name}: ❌`);
      ds.renderStack.pop();
      return ret;
    }
    const lifecycles = ds.renderStack.pop();
    if (!lifecycles) {
      console.error(`${name}: ds.renderStack.pop() was empty`);
      return ret;
    }
    // Would only happen if someone writes to the render stack during a render
    if (lifecycles !== data) {
      console.error(`${name}: ds.renderStack.pop() wrong object: ${String(lifecycles)}`);
      return ret;
    }
    // TODO: How is DocumentFragment supported?
    const el = ret as HTMLElement;
    const details: InstanceMetadata = {
      name,
      el,
      children: new Set<El>(),
      lifecycles,
    };
    ds.instanceMetadata.set(el, details);
    el.dataset[DATASET_TAG] = name;
    const instances = ds.componentNames.get(name) ?? new WeakSet<El>();
    ds.componentNames.set(name, instances.add(el));

    console.log(`${name}: Done (${Object.keys(lifecycles).length} lifecycles)`);
    console.groupEnd();
    return ret;
  };
  return wrap;
};

const type = (x: unknown, subcall?: boolean): string => {
  if (Array.isArray(x)) {
    if (subcall) return 'Array[...]';
    return `Array[${x.map(n => type(n, true)).join(', ')}]`;
  }
  if (x instanceof HTMLElement || x instanceof SVGElement) {
    const inDOM = !subcall && document.body.contains(x) ? '📶' : '';
    const meta = ds.instanceMetadata.get(x);
    const tag = meta
      ? `<${meta.name}/>${inDOM}`
      : `${ds.guardianNodes.has(x) ? 'Guard' : ''}<${x.tagName.toLowerCase()}>${inDOM}`;
    if (subcall || x.childNodes.length === 0) return tag;
    return `${tag} [${[...x.childNodes].map(n => type(n, true)).join(', ')}]`;
  }
  if (x instanceof DocumentFragment)
    return '[Fragment]';
  if (x instanceof Text)
    return `"${x.textContent ?? ''}"`;
  if (typeof x === 'undefined')
    return '∅';
  if (typeof x === 'function')
    return '[Function]';
  // Default to [object DataType]
  return `"${String(x)}"`;
};

const callLifecyclesForTree = (fn: LifecycleNames) =>
  (root: Element) => {
    let callCount = 0;
    const callLifecycleForEl = (el: El) => {
      const meta = ds.instanceMetadata.get(el);
      // If it's not a component but it could be a guardian element
      if (!meta)
        return ds.guardianNodes.get(el);

      const call = meta.lifecycles[fn];
      if (call) {
        console.log(`${type(el)}:${fn}`, meta.lifecycles);
        callCount++;
        call();
      }
      return meta;
    };
    const meta = callLifecycleForEl(root as El);
    // If not be a component or a guardian, or have nothing else to do
    if (!meta || meta.children.size === 0) {
      console.log(`${type(root)}:${fn} stopped at root. Calls: ${callCount}`);
      return;
    }
    const childSetStack = [meta.children];
    while (childSetStack.length) {
      (childSetStack.shift() as Set<El>).forEach(el => { // TS bug
        const meta = callLifecycleForEl(el);
        if (meta && meta.children.size > 0) childSetStack.push(meta.children);
      });
    }
    console.log(`${type(root)}:${fn} had children. Calls: ${callCount}`);
  };

const callAttachForTree = callLifecyclesForTree('onAttach');
const callDetachForTree = callLifecyclesForTree('onDetach');

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: SinuousApi) => {
  const { h, insert, add } = api;

  api.h = wrapReviver(h);

  api.insert = function<T>(el: Node, value: T, endMark?: Node, current?: T, startNode?: Node) {
    console.log(`Insert (current:) ${type(current)} (into:) ${type(value)}`);
    return insert(el, value, endMark, current, startNode);
  };

  api.add = (parent: El, value: string | DocumentFragment | El, endMark?: El) => {
    console.log(`${type(parent)}\n    ⬅ ${type(value)}`);

    // Here's where guardians are actually used...
    const val = value as El;
    const isComp = (el: El) => ds.instanceMetadata.has(el);
    // If comp(or guard)<-el, no action
    // If comp(or guard)<-comp, parent also guards val
    // If comp(or guard)<-guard, parent also guards val's children and val is no longer a guard
    // If el<-el, no action
    // If el<-comp, parent is now a guard of val
    // If el<-guard, parent is now a guard of val's children and val is no longer a guard
    const parentCompOrGuard
      = ds.instanceMetadata.get(parent) ?? ds.guardianNodes.get(parent);
    let valGuard;
    if (parentCompOrGuard) {
      if (isComp(val)) parentCompOrGuard.children.add(val);
      // eslint-disable-next-line no-cond-assign
      else if (valGuard = ds.guardianNodes.get(val)) {
        valGuard.children.forEach(x => parentCompOrGuard.children.add(x));
        ds.guardianNodes.delete(val);
      }
    } else {
      valGuard = ds.guardianNodes.get(val);
      if (isComp(val) || valGuard) {
        const children = valGuard ? valGuard.children : new Set([val]);
        ds.guardianNodes.set(parent, { children });
      }
      if (valGuard) ds.guardianNodes.delete(val);
    }

    const el = add(parent, value, endMark);
    if (parent.isConnected && !val.isConnected) {
      console.log('%conAttach', 'background: lightgreen', parent, value);
      // TODO: This is weird and I don't like arrays...
      if (Array.isArray(value))
        value.forEach(callAttachForTree);
      else
        callAttachForTree(val);
    }
    return el;
  };

  api.rm = (parent: El, startNode: El, endMark: El) => {
    let cursor: ChildNode | null = startNode as ChildNode;
    while (cursor && cursor !== endMark) {
      const next: ChildNode | null = cursor.nextSibling;
      // Is needed in case the child was pulled out the parent before clearing.
      if (parent === cursor.parentNode) {
        if (parent.isConnected && cursor instanceof Element) {
          console.log('%conDetach', 'background: coral', parent, cursor);
          callDetachForTree(cursor);
        }
        parent.removeChild(cursor);
      }
      cursor = next;
    }
  };
};

export { tree, trace, ds, callAttachForTree, callDetachForTree };
// Global
Object.assign(window, { tree, trace, ds, callAttachForTree, callDetachForTree });
