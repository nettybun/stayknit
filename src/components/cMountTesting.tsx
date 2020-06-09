import { h, observable } from 'sinuous';
import { tree } from '../trace';

const MountTest = (): h.JSX.Element => {
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
  return (
    <div>
      <p>The window's size is <span>{windowSize}</span></p>
      <p>This post has {xhrFetchedCommentCount} comments</p>
    </div>
  );
};

// NOICE>
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
