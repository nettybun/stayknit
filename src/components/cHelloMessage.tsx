import { h } from 'haptic';
import { signal } from 'haptic/s';
import { css } from 'styletakeout.macro';

import { lifecycles } from '../lifecycles.js';

const baseStyle = css`
  transition-timing-function: ease-in-out;
  transition-property: background-color;
  transition-duration: 500ms;
`;

const HelloMessage = ({ name }: { name: string }): h.JSX.Element => {
  // I've decided this doesn't need hydration
  const style = signal(baseStyle);

  lifecycles.onAttach(() => {
    // Simulate async call that takes some time...
    setTimeout(() => {
      style(`${baseStyle} ${css`background-color: pink;`}`);
    }, 100);
  });
  lifecycles.onDetach(() => {});
  return <div><span class={style}>Hello "{name}"</span></div>;
};

export { HelloMessage };
