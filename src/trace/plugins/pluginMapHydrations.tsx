import type { Observable } from 'sinuous/observable';

import { tree } from '../tracers.js';

type Hydrations = { [k in string]?: Observable<unknown> }

type Methods = {
  reportHydrations(observables: Hydrations): void
}

declare module '../tracers.js' {
  interface RenderStackFrame {
    hydrations?: Hydrations
  }
}

function pluginMapHydrations(): Methods {
  return {
    // This assumes there's only ever one call else it'll overwrite
    reportHydrations(observables) {
      tree.stack[tree.stack.length - 1].hydrations = observables;
    },
  };
}

export { pluginMapHydrations };
