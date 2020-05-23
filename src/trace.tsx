import type { h, Api } from 'sinuous/src';

const renderStack = ['Page'];

/** Slot for storing component lifecycle methods on render */
type LifecycleMethods = {
  onAttach?: () => void,
  onDetach?: () => void,
}

enum ComponentNameBrand { _ = '' }
type ComponentName = ComponentNameBrand & string;

// Relationship in the component tree
// Stores top-level elements only
// Use .closest() or .querySelector() to find components within the DOM
// Fragments are [data-component] marked as "Fragment:<ComponentName>"
const tree = {
  _LifecycleRenderStack: [] as LifecycleMethods[],
  _cInstanceLookup: new WeakMap<Node, ComponentName>(),
  _cNameLookup: new Map<ComponentName, Node[]>(),
  _cRelations: new WeakMap<Node, Node>(),
  _cDetached: new WeakSet<Node>(),
  // <App/> to </body>
  _cAttachmentPoints: new WeakMap<Node, Node>(),

  onAttach(callback: () => void) {
    console.log('In onAttach() callback');
    callback();
  },
  onDetach(callback: () => void) {
    console.log('In onDetach() callback');
    callback();
  },
};

const wrapReviver = (hCall: typeof h) => {
  const wrap: typeof h = (...args: unknown[]) => {
    const [fn] = args;
    if (typeof fn !== 'function') {
      // @ts-expect-error
      return hCall(...args);
    }
    console.log(`✨ ${fn.name} Maybe component?`);
    renderStack.push(fn.name);
    // @ts-expect-error
    const ret = hCall(...args);
    if (ret instanceof Node) {
      console.log(`✨ ${fn.name} Yes! Render stack:`, renderStack.join(', '));
    } else {
      console.log(`✨ ${fn.name} No. Ignoring`);
    }
    renderStack.pop();
    return ret;
  };
  return wrap;
};

// Patch Sinuous' API to trace components into a WeakMap tree
const trace = (api: Api) => {
  const { h, insert, add } = api;
  let countInserts = 0;
  let countAdds = 0;

  api.h = wrapReviver(h);

  api.insert = (...args) => {
    console.log(++countInserts, 'Insert');
    return insert(...args);
  };

  api.add = (parent: Node, value: string | Node, endMark?: Node) => {
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
    console.log(++countAdds, `${type(parent)}\n    <- ${type(value)}`);
    return add(parent, value, endMark);
  };
};

export { tree, trace };
// Global
Object.assign(window, { tree });
