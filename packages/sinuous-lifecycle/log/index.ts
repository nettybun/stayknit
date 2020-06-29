import { trace } from 'sinuous-trace';

import type { El } from 'sinuous-trace';
import type { Lifecycle, LifecyclePlugin } from '../index.js';

type LogLifecycleCSS = { [k in Lifecycle]: string }

const defaultCSS: LogLifecycleCSS = {
  onAttach: 'background: #A6E2B3', // Green
  onDetach: 'background: #F4A89A', // Red
};

function logLifecycle(
  lifecyclePlugin: LifecyclePlugin,
  consoleCSS: Partial<LogLifecycleCSS> = {}
): void {
  const { callTree } = lifecyclePlugin;

  const css: LogLifecycleCSS = Object.assign(defaultCSS, consoleCSS);
  const c = (fn: Lifecycle, extra = '') => [`%c${fn}${extra}`, `${css[fn]}`];

  let callCount = 0;
  let root: El | undefined = undefined;

  lifecyclePlugin.callTree = (fn: Lifecycle, el: El) => {
    const meta = trace.meta.get(el);
    const compStr = meta ? `<${meta.name}/>` : el;
    const entryCall = !root;

    // Setup
    if (entryCall) {
      root = el;
      console.log(...c(fn, ' for tree'), compStr);
    }
    const call = meta?.lifecycles?.[fn];
    if (call) console.log(...c(fn), `(${++callCount})`, compStr, call);
    callTree(fn, el);

    // Cleanup
    if (entryCall) {
      root = undefined;
      callCount = 0;
    }
  };
}

export { logLifecycle };
