
import type { Tracers } from '../tracers.js';
import type { RenderStackFrame } from '../ds.js';

import { ds } from '../ds.js';
import { log } from '../log.js';

let refRSF: RenderStackFrame | undefined = undefined;
const groupEnd = () => console.groupEnd();

function pluginLogs(tracers: Tracers): void {
  tracers.h.onEnter.push(() => {
    refRSF = ds.stack[ds.stack.length - 1];
    const { name } = refRSF.fn;
    console.group(`api.h() 🔶 ${name}`);
  });
  tracers.h.onExit.push(() => {
    const { name } = (refRSF as RenderStackFrame).fn;
    console.log(`${name}: Done. Render data:`, refRSF);
    console.groupEnd();
  });

  tracers.add.onEnter.push((parent, value) => {
    console.group('api.add()');
    console.log(`parent:${log(parent)}, value:${log(value)}`);
  });
  // Doesn't seem possible in a plugin architecture to know this:
  // console.log(`Found adoptive parent ${log(cursor)}`);
  tracers.add.onExit.push(groupEnd);

  tracers.insert.onEnter.push((el, value, endMark, current) => {
    console.group('api.insert()');
    console.log(`el:${log(el)}, value:${log(value)}, current:${log(current)}`);
  });
  tracers.insert.onExit.push(groupEnd);

  tracers.rm.onEnter.push(() => {
    console.group('api.rm()');
  });
  tracers.rm.onExit.push(groupEnd);
}

export { pluginLogs };
