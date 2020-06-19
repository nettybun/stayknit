import type { _h, HyperscriptApi } from 'sinuous/h';
import { tracers } from './tracers.js';
import { tree as lifecycleTree, plugins } from './tree-plugin-lifecycle.js';
import { tree as hydrationTree } from './tree-plugin-hydration.js';

const trace = (api: HyperscriptApi): void => {
  api.h = tracers.h(api.h);
  api.insert = tracers.insert(api.insert);
  api.add = tracers.add(api.add);
  api.rm = tracers.rm(api.rm);

  tracers.rm.pre = [plugins.preRm];
  tracers.add.pre = [plugins.preAdd];
  tracers.add.post = [plugins.postAdd];
};

const tree = {
  ...lifecycleTree,
  ...hydrationTree,
};

export { trace, tree };
