import type { Observable } from 'sinuous/observable';
import type { Tracers } from '../tracers.js';
import type { Tree } from '../ds.js';

import { ds } from '../ds.js';

type Hydrations = { [k in string]?: Observable<unknown> }

declare module '../ds.js' {
  interface RenderStackFrame {
    hydrations: Hydrations
  }
  interface Tree {
    reportHydrations(observables: Hydrations): void
  }
}

function pluginMapHydrations(tracers: Tracers, tree: Tree): void {
  tracers.h.onEnter.push(() => {
    ds.stack[ds.stack.length - 1].hydrations = {};
  });

  tree.reportHydrations = (observables) => {
    ds.stack[ds.stack.length - 1].hydrations = observables;
  };
}

export { pluginMapHydrations };
