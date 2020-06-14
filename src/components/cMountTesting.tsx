import { h, observable } from 'sinuous';
import { tree, ds } from '../trace/index.js';
import { api } from 'sinuous/h';
import { subscribe } from 'sinuous/observable';

import type { Observable } from 'sinuous/observable';
import type { ElementChildren } from 'sinuous/shared';

// TODO: I'll likely need to tap into sinuous/observable? No... In h() do if
// `fn.state` is a function then call it (with all the parameters? yes, that's
// easy because we always know them at runtime: props {} and ...children[])

// Then capture the output, sotre the observables in ds.compMeta.observables,
// and then replace fn.state (NOT THE PROTOTYPE JUST FOR THIS ONE INSTANCE OF
// THE FN) with a getter to compMeta

// That way it only runs once, and the component gets the observables it needs

// TODO: Use <T>? Also I need .state() to be optional
type Comp = {
  (props?: Record<string, unknown>, ...children: ElementChildren[]): h.JSX.Element;
  state: (paramArray?: Parameters<Comp>) => Record<string, Observable<unknown>>;
  hydrate: (el: Element) => void;
}

const MountTest: Comp = () => {
  // TODO: It'd be nice if Babel could factor out the code to another function
  // or have some way of having it be written in the component for readability.

  // Decorators?
  const { xhrFetchedCommentCount, windowSize } = MountTest.state();
  return (
    <div class="bg-gray-300 m-5 p-5 ml-0">
      <p>The window's size is <span>{windowSize}</span></p>
      <p>This post has {xhrFetchedCommentCount} comments</p>
    </div>
  );
};

MountTest.state = (paramArray?: Parameters<typeof MountTest>) => {
  const xhrFetchedCommentCount = observable('...');
  const windowSize = observable('...');

  const onWindowResize = debounce(() => {
    windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);
  tree.onAttach(() => {
    // Fetch('/404')
    //   .then(r => r.text())
    //   .then(count => xhrFetchedCommentCount(count));
    setTimeout(() => {
      xhrFetchedCommentCount('50');
    }, 500);
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  });
  tree.onDetach(() => {
    window.removeEventListener('resize', onWindowResize);
  });

  return { xhrFetchedCommentCount, windowSize };
};

// A .hydrate() method hydrates SSR HTML at runtime. It's specific to the exact
// component, and will be provided the element and data set specifically by the
// server during its setup or .state() run. These parameters are stored in the
// hydration object on the server and serialized into the client JS

// TODO: It might be possible to completely automate this? At least the generic
// observable splicing, event reg, and tree methods.
MountTest.hydrate = (el: Element) => {
  const { xhrFetchedCommentCount, windowSize } = MountTest.state();
  // FIXME: Pass compMeta into .hydrate() directly. Saves load/store/check/if
  const meta = ds.compMeta.get(el);
  if (!meta) throw `No meta for ${el.tagName}`;
  // # meta.observables.forEach::subscribe(() => api.insert());
};

// NOICE.
function debounce(func: (...args: unknown[]) => void, wait: number, immediate?: boolean) {
  let timeout: number | null;
  return (...args: unknown[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    timeout && window.clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

export { MountTest };
