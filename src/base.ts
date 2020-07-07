import { api } from 'sinuous/h';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';
import { trace } from 'sinuous-trace';
import { lifecycle } from 'sinuous-lifecycle';
import { logTrace } from 'sinuous-trace/log';
import { logLifecycle } from 'sinuous-lifecycle/log';

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
type El = HTMLElement | SVGElement | DocumentFragment
type Component = () => El
type HyperscriptCall = (
  tag: Component | Observable<unknown> | ElementChildren[] | [] | string,
  props?: (JSXInternal.HTMLAttributes | JSXInternal.SVGAttributes) & Record<string, unknown>,
  ...children: ElementChildren[]
) => El;

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

trace(api);
lifecycle(api, trace);
logTrace(api, trace);
logLifecycle(trace, lifecycle);

const hooks = {
  onAttach(callback: () => void): void { lifecycle.set('onAttach', callback); },
  onDetach(callback: () => void): void { lifecycle.set('onDetach', callback); },
};

const when = (
  condition: () => string,
  views: { [k in string]?: Component }
): () => El | undefined => {
  const rendered: { [k in string]?: El } = {};
  return () => {
    const cond = condition();
    if (!rendered[cond] && views[cond])
      rendered[cond] = root(() => h(views[cond] as Component));
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

const inSSR = typeof window === 'undefined';

export { HyperscriptCall }; // Types
export { h, svg, api, hooks, inSSR, when };
