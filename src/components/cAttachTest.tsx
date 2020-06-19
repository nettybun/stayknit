import { h, observable } from 'sinuous';
import { tree } from '../trace/index.js';
import type { JSXEl } from '../types/index.js';

// XXX: Automate this
// At least the generic observable splicing, event reg, and tree methods.
// const liveObservables = C.hydrate();
// const meta = ds.compMeta.get(el /* From the SSR run / querySelector */);
// if (!meta) throw `No meta for ${el.tagName}`;
// meta.observableLocationMarkers.forEach::subscribe(() => api.insert());

const AttachTest = (): JSXEl => {
  const s = {
    xhrFetchedCommentCount: observable('...'),
    windowSize: observable('...'),
  };
  const onWindowResize = debounce(() => {
    s.windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);
  const fetchController = new AbortController();
  tree.onAttach(() => {
    void fetch('/fetchData.txt', { signal: fetchController.signal })
      .then(r => r.text())
      .then(count => s.xhrFetchedCommentCount(count));
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  });
  tree.onDetach(() => {
    fetchController.abort();
    window.removeEventListener('resize', onWindowResize);
  });
  tree.saveHydrations(s);
  // Short circuit render. Observables will be patched into existing DOM
  if (window.hydrating) return null;

  return (
    <div class="bg-gray-300 m-5 p-5 ml-0">
      {/* During SSR these observables are tracked by inserting tagged span tags
          to act as location markers for patching during hydration */}
      <p>The window's size is <span>{s.windowSize}</span></p>
      <p>This post has {s.xhrFetchedCommentCount} comments</p>
    </div>
  );
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

export { AttachTest };
