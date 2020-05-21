import type { Api } from 'sinuous/src';

const renderStack = ['Page'];
const renderMap = new WeakMap();

// Global
Object.assign(window, { renderStack, renderMap });

export const traceH = (h: Function) => {
  return (...args: unknown[]) => {
    const [fn] = args;
    if (typeof fn !== 'function') {
      return h(...args);
    }
    console.log(`✨ ${fn.name} Maybe component?`);
    renderStack.push(fn.name);
    const ret = h(...args);
    if (ret instanceof Node) {
      console.log(`✨ ${fn.name} Yes! Render stack:`, renderStack.join(', '));
    } else {
      console.log(`✨ ${fn.name} No. Ignoring`);
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
