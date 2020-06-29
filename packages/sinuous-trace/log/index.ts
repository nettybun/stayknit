import type { HyperscriptApi } from 'sinuous/h';
import type { El, Tracers, RenderStackFrame, InstanceMeta } from '../index.js';

import { trace } from '../index.js';
import { createLogFunction } from './log.js';

type LogTraceOptions = {
  maxArrayItems: number,
  maxStringLength: number,
  /** Tag component nodes: `<h1 data-[TAG]="MyComponent"></h1>` */
  componentDatasetTag: string,
}

const defaultOptions: LogTraceOptions = {
  maxArrayItems: 3,
  maxStringLength: 10,
  componentDatasetTag: 'component',
};

let refRSF: RenderStackFrame | undefined;
let initialParentDuringAdd: El | undefined;

function logTrace(
  api: HyperscriptApi,
  tracers: Tracers,
  options: Partial<LogTraceOptions> = {}
): void {
  const { h, add, insert, property, rm } = api;
  const { h: { onCreate }, add: { onAttach }, rm: { onDetach } } = tracers;

  const opts: LogTraceOptions = Object.assign(defaultOptions, options);
  const log = createLogFunction(opts);

  const tag = (el: HTMLElement, name: string) =>
    el.dataset[opts.componentDatasetTag] = name;

  api.h = (fn, ...args) => {
    if (typeof fn === 'function') {
      console.group(`api.h() 🔶 ${fn.name}`);
      // During this h() the tracer will run and save the RSF
      const retH = h(fn, ...args);
      console.log(`${fn.name}: Done. Render data:`, refRSF);
      console.groupEnd();
      return retH;
    }
    return h(fn, ...args);
  };
  tracers.h.onCreate = (_, el) => {
    refRSF = trace.meta.get(el) as InstanceMeta;
    const { name } = refRSF;
    if (!(el instanceof Node)) {
      console.log(`${name}: Function was not a component. Skipping`);
    } else {
      // Optionally provide a tag onto the element
      if (opts.componentDatasetTag) {
        if (el instanceof Element) tag(el as HTMLElement, name);
        else el.childNodes.forEach(x => tag(x as HTMLElement, `Fragment::${name}`));
      }
    }
    onCreate(_, el);
  };

  api.add = (parent, value, end) => {
    console.group('api.add()');
    console.log(`parent:${log(parent)}, value:${log(value)}`);
    initialParentDuringAdd = parent;
    // During this add() the tracer is called
    const retAdd = add(parent, value, end);
    initialParentDuringAdd = undefined;
    console.groupEnd();
    return retAdd;
  };
  tracers.add.onAttach = (parent, child) => {
    const msg = `Tree attach: ${log(parent)} receives ${log(child)}`;
    console.log(
      parent === initialParentDuringAdd
        ? msg
        : `${msg} (Adoptive parent)`
    );
    onAttach(parent, child);
  };

  api.insert = (el, value, endMark, current) => {
    console.group('api.insert()');
    console.log(`el:${log(el)}, value:${log(value)}, current:${log(current)}`);
    const retInsert = insert(el, value, endMark, current);
    console.groupEnd();
    return retInsert;
  };

  api.property = (el, value, name, ...rest) => {
    console.group('api.property()');
    console.log(`el:${log(el)}, value:${log(value)}, name:${log(name)}`);
    const retProperty = property(el, value, name, ...rest);
    console.groupEnd();
    return retProperty;
  };

  api.rm = (parent, start, endMark) => {
    console.group('api.rm()');
    console.log(`parent:${log(parent)}, start:${log(start)}, endMark:${log(endMark)}`);
    const retRm = rm(parent, start, endMark);
    console.groupEnd();
    return retRm;
  };
  tracers.rm.onDetach = (parent, child) => {
    console.log(`Tree detach: ${log(parent)} unlinks ${log(child)}`);
    onDetach(parent, child);
  };
}

export { LogTraceOptions }; // Types
export { logTrace };
