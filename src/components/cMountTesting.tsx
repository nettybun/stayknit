import { h, observable } from 'sinuous';
import { tree, ds } from '../trace/index.js';
import { ObservableCollection } from '../types/index.js';

// XXX: Not allowed to return an ObservableCollection...
// Instead of having the hydration function call MyComp.hydrate I might need to
// pass in a special prop to provide type safety...

// Meaning that <MountTest hydrate> => ObservableCollection (not assignable as a
// JSX element, which is good). The real call convention would be as a function
// in the reviver: MountTest({ hydrate: true }) => ObservableCollection

// A lot of this comes down to functions not being able to inspect their own...
// self? I suppose it's `this` but () => {} doesn't have `this`

const MountTest: Component = () => {
  const xhrFetchedCommentCount = observable('...');
  const windowSize = observable('...');

  const onWindowResize = debounce(() => {
    windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);
  const fetchController = new AbortController();
  tree.onAttach(() => {
    void fetch('/404', { signal: fetchController.signal })
      .then(r => r.text())
      .then(count => xhrFetchedCommentCount(count));
    setTimeout(() => {
      xhrFetchedCommentCount('50');
    }, 500);
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  });
  tree.onDetach(() => {
    fetchController.abort();
    window.removeEventListener('resize', onWindowResize);
  });

  // Short circuit render. Observables will be patched into existing DOM
  if (window.hydrating)
    return { xhrFetchedCommentCount, windowSize };

  return (
    <div class="bg-gray-300 m-5 p-5 ml-0">
      {/* During SSR these observables are tracked by inserting tagged span tags
          to act as location markers for patching during hydration */}
      <p>The window's size is <span>{windowSize}</span></p>
      <p>This post has {xhrFetchedCommentCount} comments</p>
    </div>
  );
};

MountTest.hydrate = MountTest as unknown as () => ObservableCollection;

// TODO: Automate this
// At least the generic observable splicing, event reg, and tree methods.
// const liveObservables = C.hydrate();
// const meta = ds.compMeta.get(el /* From the SSR run / querySelector */);
// if (!meta) throw `No meta for ${el.tagName}`;
// meta.observableLocationMarkers.forEach::subscribe(() => api.insert());

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
