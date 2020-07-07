import { h, hooks } from '../sinuous.js';
import { observable, computed } from 'sinuous/observable';
import { inSSR, debounce } from '../util.js';
import { HelloMessage } from './cHelloMessage.js';

const AttachTest = (): h.JSX.Element => {
  const s = {
    xhrFetchedCommentCount: observable('...'),
    windowSize: observable('...'),
  };
  const onWindowResize = debounce(() => {
    s.windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);

  // XXX: SSR isn't updating the DOM but this _is_ called...
  // Imagine api.insert() isn't working with SoftDOM
  computed(() => {
    console.log('Value of xhrFetchedCommentCount:', s.xhrFetchedCommentCount());
  });

  const fetchController = new AbortController();
  hooks.onAttach(() => {
    void fetch('fetchData.txt', { signal: fetchController.signal })
      .then(r => r.text())
      .then(count => s.xhrFetchedCommentCount(count));
    if (!inSSR) {
      onWindowResize();
      window.addEventListener('resize', onWindowResize);
    }
  });

  hooks.onDetach(() => {
    fetchController.abort();
    if (!inSSR) {
      window.removeEventListener('resize', onWindowResize);
    }
  });

  return (
    <div class="bg-gray-300 mt-5 p-5">
      <p>The window's size is <span>{s.windowSize}</span></p>
      <p>This post has {s.xhrFetchedCommentCount} comments</p>
      <HelloMessage name="Nested! (Works)"/>
    </div>
  );
};

export { AttachTest };
