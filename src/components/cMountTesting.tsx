import { h, observable } from 'sinuous/jsx';
import { tree } from '../trace';

const MountTest = () => {
  const xhrFetchedCommentCount = observable('');
  const windowSize = observable('');

  const onWindowResize = () => {
    windowSize(`${window.innerWidth}px x ${window.innerHeight}px`);
  };
  tree.onAttach(() => {
    fetch('')
      .then(r => r.text())
      .then(count => xhrFetchedCommentCount(count));
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

export { MountTest };
