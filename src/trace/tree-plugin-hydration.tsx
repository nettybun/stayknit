import type { Observable } from 'sinuous/observable';
import { ds } from './ds.js';

type Hydrations = { [k in string]?: Observable<unknown> }
type HydrationStackFrameKey = {
  hydrations: Hydrations
}

const tree = {
  saveHydrations(observables: Hydrations): void {
    ds.stack[ds.stack.length - 1].hydrations = observables;
  },
};

export { HydrationStackFrameKey }; // Types
export { tree };
