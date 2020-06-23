import { h, api } from 'sinuous';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import { trace } from './trace/index.js';
import { pluginLifecycles } from './trace/plugins/pluginLifecycles.js';
import { pluginMapHydrations } from './trace/plugins/pluginMapHydrations.js';
import { pluginLogs } from './trace/plugins/pluginLogs.js';

import type { El } from './trace/ds.js';

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

const tree = {
  ...pluginMapHydrations(tracers),
  ...pluginLifecycles(tracers),
};
// Must be last...need to figure out Express middleware...
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

const middleware: ((...args: unknown[]) => El)[] = [
  (one, two) => {
    console.log('Hey 1', one, two);
    const el = next();
    console.log('Bye 1');
    return el;
  },
  () => {
    console.log('Hey 2');
    return next();
  },
  (one, two, three) => {
    console.log('Hey 3');
    const el = next();
    console.log('Bye 3', three);
    return el;
  },
  () => {
    console.log('Hey 4');
    return <p>Answer</p>;
  },
];
let next: () => El = () => ({}) as El;
function call(i: number, ...args: unknown[]): El {
  next = () => call(i + 1, ...args);
  return middleware[i](...args);
}

const answer = call(0, 4, 3, 2);
console.log('Answer:', answer);

export { h, svg, api, tree, when };
