import { api } from '/web_modules/haptic';

import { trace } from 'sinuous-trace';
import { lifecycle } from 'sinuous-lifecycle';
import { logTrace } from 'sinuous-trace/log';
import { logLifecycle } from 'sinuous-lifecycle/log';

import type { Signal } from '/web_modules/haptic/s';

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

/**
 * I put this in haptic/s.js
 * It mostly works, but as signals are garbage collected/destroyed the counter
 * won't go down. Only shows WritableSignal creation. Need to patch computed()
 * to see those and DOM subscriptions... Maybe patch h()#api.subscribe?

const sDeclarations = new Map();
const { origin } = window;

const stackTraceBlink = new RegExp(` at (\\w+) \\(${origin}(.+\\.js.+)\\)`);
const stackTraceGecko = new RegExp(`(\\w+)@${origin}(.+\\.js.+)`);

const s = (arg) => {
  let error;
  try { throw Error(''); } catch (err) { error = err; }
  if (error.stack) {
    error = error.stack.split('\n');
    // Blink-based browsers do this
    if (error[0] === 'Error') error.shift();
    const [hereLine, callerLine] = error;
    const match
      = callerLine.startsWith('    at ')
        ? stackTraceBlink.exec(callerLine)
        : stackTraceGecko.exec(callerLine);
    if (match) {
      const [matchLine, callerFn, callerLocation] = match;
      const loc = `${callerFn}@${callerLocation}`;
      const count = (sDeclarations.get(loc) ?? 0) + 1;
      sDeclarations.set(loc, count);
      console.log(`Signal declared at ${loc}#${count}`);
    }
  }
  return y(arg);
};
 */

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
