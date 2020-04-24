import type { Api } from 'sinuous';

const renderStack = ['Page'];
const renderMap = new WeakMap();

// Global
Object.assign(window, { renderStack, renderMap });

export const traceH = <T extends Array<unknown>, U>(fn: (...args: T) => U) => {
  return (...args: T): U => {
    const [type] = args;
    if (typeof type !== 'function') {
      return fn(...args);
    }
    console.log(`✨ ${type.name} Maybe component?`);
    renderStack.push(type.name);
    const ret = fn(...args);
    if (ret instanceof Node) {
      console.log(`✨ ${type.name} Yes! Render stack:`, renderStack.join(', '));
    } else {
      console.log(`✨ ${type.name} No. Ignoring`);
    }
    renderStack.pop();
    return ret;
  };
};

// Patch Sinuous' API to trace components into a WeakMap tree
export const traceAPI = (api: Api) => {
  let countInserts = 0;
  const { insert } = api;
  api.insert = (...args) => {
    console.log(++countInserts, 'Insert');
    return insert(...args);
  };
  let countAdds = 0;
  const { add } = api;
  api.add = (...args) => {
    const [parent, value] = args.map(el => {
      if (el instanceof HTMLElement) {
        let str = `[<${el.tagName.toLowerCase()}`;
        if (el.className) str += `.${el.className.replace(/\s+/g, '.')}`;
        str += `> w/ ${el.childNodes.length} kids]`;
        return str;
      }
      if (el instanceof DocumentFragment) {
        return '[Frag]';
      }
      return `"${String(el)}"`;
    });
    console.log(++countAdds, `${parent}\n    <- ${value}`);
    return add(...args);
  };
};
