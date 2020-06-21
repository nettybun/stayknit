import type { HyperscriptApi } from 'sinuous/h';
import type { Tracers } from './tracers.js';

import { tracers } from './tracers.js';

const trace = (api: HyperscriptApi): Tracers => {
  api.h = tracers.h(api.h);
  api.insert = tracers.insert(api.insert);
  api.add = tracers.add(api.add);
  api.rm = tracers.rm(api.rm);
  return tracers;
};

export { trace };
