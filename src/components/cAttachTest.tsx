import { h, observable } from 'sinuous';
// import { tree } from '../trace/index.js';
import type { JSXEl } from '../types/index.js';

const AttachTest = (): JSXEl => {
  const s = {
    xhrFetchedCommentCount: observable('...'),
    windowSize: observable('...'),
  };
  const onWindowResize = debounce(() => {
    s.windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  }, 250);

  // tree.onAttach(() => {
  //   void fetch('/fetchData.txt')
  //     .then(r => r.text())
  //     .then(count => s.xhrFetchedCommentCount(count));
  //   onWindowResize();
  //   window.addEventListener('resize', onWindowResize);
  // });

  // tree.onDetach(() => {
  //   window.removeEventListener('resize', onWindowResize);
  // });

  return (
    <div class="bg-gray-300 m-5 p-5 ml-0">
      <p>The window's size is <span>{s.windowSize}</span></p>
      <p>This post has {s.xhrFetchedCommentCount} comments</p>
    </div>
  );
};

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
