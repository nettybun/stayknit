import type { Observable } from 'sinuous/observable';
import type { Tracers } from '../tracers.js';

import { ds } from '../ds.js';

type Hydrations = { [k in string]?: Observable<unknown> }

type ReturnMethods = {
  reportHydrations(observables: Hydrations): void
}

declare module '../ds.js' {
  interface RenderStackFrame {
    hydrations: Hydrations
  }
}

function pluginMapHydrations(tracers: Tracers): ReturnMethods {
  const { onEnter: hEnter } = tracers.h;

  tracers.h.onEnter = (...o) => {
    ds.stack[ds.stack.length - 1].hydrations = {};
    hEnter(...o);
  };

  return {
    reportHydrations(observables) {
      ds.stack[ds.stack.length - 1].hydrations = observables;
    },
  };
}

export { pluginMapHydrations };
