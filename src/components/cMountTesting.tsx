import { h, observable } from 'sinuous';
import { tree } from '../trace/index.js';

const MountTest = (): h.JSX.Element => {
  const xhrFetchedCommentCount = observable('...');
  const windowSize = observable('...');

  if (typeof window !== 'undefined') {
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
  }
  return (
    <div class="bg-gray-300 m-5 p-5 ml-0">
      <p>The window's size is <span>{windowSize}</span></p>
      <p>This post has {xhrFetchedCommentCount} comments</p>
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

export { MountTest };
