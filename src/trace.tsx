import type { h, SinuousApi } from 'sinuous';

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

// Not actually used, only to provide hints in DevTools
/** El.dataset[DATASET_TAG] = ComponentName; Also as <h1 data-DATASET_TAG /> */
const DATASET_TAG = 'component';

type El = (Element | DocumentFragment)
        & { dataset?: { [DATASET_TAG]?: ComponentName } & DOMStringMap };
type Component = El;

type LifecycleNames =
  | 'onAttach'
  | 'onDetach'

type LifecycleMethods = {
  [K in LifecycleNames]?: () => void;
}

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
   * Non-component elements with children components are marked as guardians so
   * future parented components know of them. This marker is moved to every new
   * non-component parent until a component is hit */
  guardianNodes: new WeakMap<El, { children: Set<Component> }>(),

  /** WeakMap a given instance (DOM element) to component metadata */
  instanceMetadata: new WeakMap<Component, InstanceMetadata>(),

  /** Map a component name to all of its instances (DOM elements) */
  componentNames: new Map<ComponentName, WeakSet<Component>>(),
};

// If ds.renderStack is unexpectedly empty, these will throw
const tree = {
  /** Lifecycle. Setup during component render */
  onAttach(callback: () => void) {
    console.log('Installing onAttach lifecycle');
    ds.renderStack[ds.renderStack.length - 1].onAttach = callback;
  },
  /** Lifecycle. Setup during component render */
  onDetach(callback: () => void) {
    console.log('Installing onDetach lifecycle');
    ds.renderStack[ds.renderStack.length - 1].onDetach = callback;
  },
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
    console.groupCollapsed(`${name}`);
    const data = {};
    ds.renderStack.push(data);
    // @ts-ignore TS incorrectly destructs the overload as `&` instead of `|`
    const el: HTMLElement | SVGElement | DocumentFragment = hCall(...args);

    // Match Element and DocumentFragment
    if (el instanceof Node) {
      console.log(`${name}: ✅`);
    } else {
      console.log(`${name}: ❌`);
      ds.renderStack.pop();
      return el;
    }
    const lifecycles = ds.renderStack.pop();
    // Would only happen if someone writes to the render stack during a render
    if (!lifecycles || lifecycles !== data) {
      console.error(`${name}: ds.renderStack.pop() was empty or wrong object`);
      return el;
    }
    const details: InstanceMetadata = {
      name,
      el,
      children: new Set<El>(),
      lifecycles,
    };
    ds.instanceMetadata.set(el, details);
    const instances = ds.componentNames.get(name) ?? new WeakSet<El>();
    ds.componentNames.set(name, instances.add(el));
    // TODO: Support DocumentFragment
    if (!(el instanceof DocumentFragment)) {
      el.dataset[DATASET_TAG] = name;
    }
    console.log(`${name}: Done. Installed lifecycles: ${Object.keys(lifecycles).length}`);
    console.groupEnd();
    return el;
  };
  return wrap;
};

const type = (x: unknown, subcall?: boolean): string => {
  if (Array.isArray(x)) {
    if (subcall) return 'Array[...]';
    return `Array[${x.map(n => type(n, true)).join(', ')}]`;
  }
  if (x instanceof Element || x instanceof DocumentFragment) {
    const inDOM = !subcall && document.body.contains(x) ? '📶' : '';
    const comp = ds.instanceMetadata.get(x);
    const tagName = x instanceof Element
      ? `<${x.tagName.toLowerCase()}>`
      : '[Fragment]';
    const tag = comp
      ? `<${comp.name}/>${inDOM}`
      : `${ds.guardianNodes.has(x) ? 'Guard' : ''}${tagName}${inDOM}`;
    if (subcall || x.childNodes.length === 0) return tag;
    return `${tag} [${[...x.childNodes].map(n => type(n, true)).join(', ')}]`;
  }
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
        console.log(`${type(el)}:${fn}`, call);
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

  api.insert = (el, value, endMark, current, startNode) => {
    console.log(`Insert (current:) ${type(current)} (into:) ${type(value)}`);
    return insert(el, value, endMark, current, startNode);
  };

  api.add = (parent: El, value, endMark) => {
    console.log(`${type(parent)}\n    ⬅ ${type(value)}`);

    // Tracing can only handle Element types, while api.add receives datatypes
    // like Arrays and Fragments (see h/index.d.ts#Value). Thankfully these are
    // unrolled and eventually sent back to api.add (this function)
    const retAdd = add(parent, value, endMark);
    if (!(value instanceof Element)) return retAdd;

    // Here's where guardians are actually used...
    const isComp = (el: Element) => ds.instanceMetadata.has(el);
    // If comp(or guard)<-el, no action
    // If comp(or guard)<-comp, parent also guards val
    // If comp(or guard)<-guard, parent also guards val's children and val is no longer a guard
    // If el<-el, no action
    // If el<-comp, parent is now a guard of val
    // If el<-guard, parent is now a guard of val's children and val is no longer a guard
    const parentCompOrGuard
      = ds.instanceMetadata.get(parent) ?? ds.guardianNodes.get(parent);
    let valueGuard;
    if (parentCompOrGuard) {
      if (isComp(value)) parentCompOrGuard.children.add(value);
      // eslint-disable-next-line no-cond-assign
      else if (valueGuard = ds.guardianNodes.get(value)) {
        valueGuard.children.forEach(x => parentCompOrGuard.children.add(x));
        ds.guardianNodes.delete(value);
      }
    } else {
      valueGuard = ds.guardianNodes.get(value);
      if (isComp(value) || valueGuard) {
        const children = valueGuard ? valueGuard.children : new Set([value]);
        ds.guardianNodes.set(parent, { children });
      }
      if (valueGuard) ds.guardianNodes.delete(value);
    }

    if (parent.isConnected && !value.isConnected) {
      console.log('%conAttach', 'background: lightgreen', parent, value);
      callAttachForTree(value);
    }
    return retAdd;
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
