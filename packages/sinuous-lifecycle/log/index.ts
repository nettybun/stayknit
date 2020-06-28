import { trace } from 'sinuous-trace';

import type { Tracers, El, InstanceMeta } from 'sinuous-trace';
import type { LifecycleNames } from '../index.js';

let currentRoot: El | undefined = undefined;
let callCount: number | undefined = undefined;

function logLifecycleHook(name: LifecycleNames, fn: () => void): () => void {
  return () => {
    const entryCall = typeof callCount === 'undefined';
    if (entryCall) {
      // This is the very first call
      const comp = trace.meta.get(currentRoot as El);
      const compStr = comp && `<${comp.name}/>`;
      console.log(`${name} call for root`, compStr ?? currentRoot);
      callCount = 0;
    }
    // TS bug
    const count = ++(callCount as number);
    console.log(`%c${name}`, 'background: coral', `(${count})`, fn);
    fn();
    if (entryCall) {
      callCount = undefined;
    }
  };
}

function logLifecycle(tracers: Tracers): void {
  const { add: { onAttach }, rm: { onDetach } } = tracers;

  tracers.add.onAttach = (parent, child) => {
    currentRoot = child;
    onAttach(parent, child);
    currentRoot = undefined;
  };

  tracers.rm.onDetach = (parent, child) => {
    currentRoot = child;
    onDetach(parent, child);
    currentRoot = undefined;
  };
}

export { logLifecycle, logLifecycleHook };
