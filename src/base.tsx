import { api } from 'sinuous/h';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import { trace } from './trace/tracers.js';
import { pluginLifecycles } from './trace/plugins/pluginLifecycles.js';
import { pluginMapHydrations } from './trace/plugins/pluginMapHydrations.js';
import { pluginLogs } from './trace/plugins/pluginLogs.js';

import type { JSXInternal } from 'sinuous/jsx';
import type { ElementChildren } from 'sinuous/shared';
import type { Observable } from 'sinuous/observable';

declare module 'sinuous/jsx' {
  // Disallow children on components that don't declare them explicitly
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSXInternal {
    interface IntrinsicAttributes {
      children?: never;
    }
    interface DOMAttributes<Target extends EventTarget> {
      children?: ElementChildren;
    }
  }
}

// WIP: SSR support
declare global {
  interface Window {
    hydrating?: boolean;
  }
}

// This is lying but I need to not have overloads like sinuous/h does...
type Component = () => HTMLElement | SVGElement | DocumentFragment
type HyperscriptCall = (
  tag: Component | Observable<unknown> | ElementChildren[] | [] | string,
  props?: (JSXInternal.HTMLAttributes | JSXInternal.SVGAttributes) & Record<string, unknown>,
  ...children: ElementChildren[]
) => HTMLElement | SVGElement | DocumentFragment;

declare module 'sinuous/h' {
  interface HyperscriptApi {
    // `h: typeof h` throws "Subsequent declarations must have the same type"
    subscribe: typeof subscribe;
    cleanup: typeof cleanup;
    root: typeof root;
    sample: typeof sample;
  }
}

// Sinuous requires an observable implementation
api.subscribe = subscribe;
api.cleanup = cleanup;
api.root = root;
api.sample = sample;

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace h {
  // @ts-expect-error Not allowed to use `import type` but works either way
  export import JSX = JSXInternal;
}
// This _must_ be a function for TS to perform declaration merging
function h(...args: Parameters<HyperscriptCall>): ReturnType<HyperscriptCall> {
  return (api.h as HyperscriptCall)(...args);
}

const tracers = trace.setup(api);

const hydrationMethods = pluginMapHydrations();
const lifecycleMethods = pluginLifecycles(api, tracers);
pluginLogs(api, tracers);

const treeMethods = {
  ...hydrationMethods,
  ...lifecycleMethods,
};
type Fns = keyof typeof treeMethods
for (const key of Object.keys(treeMethods) as Fns[]) {
  const prevFn = treeMethods[key];
  // @ts-ignore Why do they make wrapping functions so incredibly hard
  treeMethods[key] = (...args) => { !inSSR && prevFn(...args); };
}

const inSSR = typeof window === 'undefined';

const when = (
  condition: () => string,
  views: { [k in string]?: () => Element}
): () => Element | undefined => {
  const rendered: { [k in string]?: Element } = {};
  return () => {
    const cond = condition();
    if (!rendered[cond] && views[cond])
      rendered[cond] = root(() => (views[cond] as () => Element)());
    return rendered[cond];
  };
};

const svg = <T extends () => Element>(closure: T): ReturnType<T> => {
  const prev = api.s;
  api.s = true;
  const el = closure();
  api.s = prev;
  return el as ReturnType<T>;
};

export { HyperscriptCall }; // Types
export { h, svg, api, treeMethods as tree, inSSR, when };
