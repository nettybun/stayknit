import type { _h, HyperscriptApi } from 'sinuous/h';
import { tracers } from './tracer.js';
import { tracers as lifecycle } from './tree-plugin-lifecycle.js';

const trace = (api: HyperscriptApi): void => {
  api.h = tracers.h(api.h);
  api.insert = tracers.insert(api.insert);
  api.add = lifecycle.add(tracers.add(api.add));
  api.rm = lifecycle.rm(tracers.rm(api.rm));
};

export { trace };
