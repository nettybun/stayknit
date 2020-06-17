import { h, observable } from 'sinuous';
import { tree, ds } from '../trace/index.js';

// XXX: Automate this
// At least the generic observable splicing, event reg, and tree methods.
// const liveObservables = C.hydrate();
// const meta = ds.compMeta.get(el /* From the SSR run / querySelector */);
// if (!meta) throw `No meta for ${el.tagName}`;
// meta.observableLocationMarkers.forEach::subscribe(() => api.insert());

// XXX: Not allowed to return an ObservableCollection...
// Instead of having the hydration function call MyComp.hydrate I might need to
// pass in a ~~special prop~~ function argument to provide type safety.
// Considering I'm opinionated about component children, I'd like to type check
// that all components are void elements (no children) and can change the
// definition of Component to (props: {}, hydrate)

// A lot of this comes down to functions not being able to inspect their own...
// self? I suppose it's `this` but () => {} doesn't have `this`

const AttachTest: HydratableComponent = () => {
  // This is now just a calling convention (rather than explicit data passing
  // within the tracer). To be a HydratableComponent means you promise to put
  // all observables in this object for later
  const s = AttachTest.hydrations;
  s.xhrFetchedCommentCount = observable('...');
  s.windowSize = observable('...');

  const onWindowResize = debounce(() => {
    s.windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);
  const fetchController = new AbortController();
  tree.onAttach(() => {
    void fetch('/404', { signal: fetchController.signal })
      .then(r => r.text())
      .then(count => s.xhrFetchedCommentCount(count));
    setTimeout(() => {
      s.xhrFetchedCommentCount('50');
    }, 500);
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  });
  tree.onDetach(() => {
    fetchController.abort();
    window.removeEventListener('resize', onWindowResize);
  });

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
AttachTest.hydrations = {};

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
