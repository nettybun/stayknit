import { h, api } from 'sinuous';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import { trace } from './trace/index.js';
import { pluginLifecycles } from './trace/plugins/pluginLifecycles.js';
import { pluginMapHydrations } from './trace/plugins/pluginMapHydrations.js';
import { pluginLogs } from './trace/plugins/pluginLogs.js';

import type { Tree } from './trace/ds.js';

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

const tracers = trace(api);
const tree = {} as Tree;
pluginLifecycles(tracers, tree);
pluginMapHydrations(tracers, tree);
pluginLogs(tracers);

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

export { h, svg, api, tree, when };
