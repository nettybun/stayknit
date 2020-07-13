import { h, hooks } from '../sinuous.js';
import { observable } from 'sinuous/observable';
import { css } from 'style-takeout.macro';

const baseStyle = css`
  transition-timing-function: ease-in-out;
  transition-property: background-color;
  transition-duration: 500ms;
`;

const orangeStyle = css`
  background-color: #ff8822;
`;

const HelloMessage = ({ name }: { name: string }): h.JSX.Element => {
  // I've decided this doesn't need hydration
  const style = observable(baseStyle);

  hooks.onAttach(() => {
    // Simulate async call that takes some time...
    setTimeout(() => {
      style(`${baseStyle} ${orangeStyle}`);
    }, 100);
  });
  hooks.onDetach(() => {});
  return <span class={style}>Hello "{name}"</span>;
};

export { HelloMessage };
