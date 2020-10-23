import { api } from 'haptic';

import { trace } from 'sinuous-trace';
import { lifecycle } from 'sinuous-lifecycle';
import { logTrace } from 'sinuous-trace/log';
import { logLifecycle } from 'sinuous-lifecycle/log';

import type { Signal } from 'haptic/s';

let ran = false;

/** Install lifecycle hooks into the Sinuous/Haptic API */
const lifecyclesInstall = () => {
  if (ran) throw new Error('Lifecycle installation ran twice');
  ran = true;

  trace(api);
  lifecycle(api, trace);

  // Save these...
  const { add, insert, property, rm } = api;
  const { onAttach, onDetach } = trace.tracers;
  // Overwrite them here:
  logTrace(api, trace);
  // Reduce logging by restoring the overwritten functions to the saved originals
  Object.assign(api, { add, insert, property, rm });
  Object.assign(trace.tracers, { onAttach, onDetach });
  logLifecycle(trace, lifecycle);
};

/** Component lifecycles */
const lifecycles = {
  onAttach(callback: () => void): void { lifecycle.set('onAttach', callback); },
  onDetach(callback: () => void): void { lifecycle.set('onDetach', callback); },
  // For SSR
  saveSignals(signals: { [k: string]: Signal<unknown> }): void {
    const rsf = trace.stack[trace.stack.length - 1];
    rsf.signals = signals;
  },
};

declare global {
  interface Window {
    hydrating?: boolean;
  }
}
declare module 'sinuous-trace' {
  interface RenderStackFrame {
    // Related to hooks.saveSignals()
    signals?: Record<string, Signal<unknown>>;
  }
}

export { lifecyclesInstall, lifecycles };
