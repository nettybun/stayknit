import { h, api } from 'sinuous';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import { tree } from './trace/tracers.js';
import { pluginLifecycles } from './trace/plugins/pluginLifecycles.js';
import { pluginMapHydrations } from './trace/plugins/pluginMapHydrations.js';
import { pluginLogs } from './trace/plugins/pluginLogs.js';

import type { El } from './trace/tracers.js';

// Disallow children on components that don't declare them explicitly
// declare module 'sinuous/jsx' {
//   interface IntrinsicAttributes {
//     children?: never;
//   }
// }

// Sinuous requires an observable implementation
declare module 'sinuous/h' {
  interface HyperscriptApi {
    subscribe: typeof subscribe;
    cleanup: typeof cleanup;
    root: typeof root;
    sample: typeof sample;
  }
}

api.subscribe = subscribe;
api.cleanup = cleanup;
api.root = root;
api.sample = sample;

const tracers = tree.setup(api);

const hydrationMethods = pluginMapHydrations();
const lifecycleMethods = pluginLifecycles(api, tracers);
pluginLogs(api, tracers);

const treeMethods = {
  ...hydrationMethods,
  ...lifecycleMethods,
};

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

export { h, svg, api, treeMethods as tree, when };
