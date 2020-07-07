import { h, hooks } from '../sinuous.js';
import { observable } from 'sinuous/observable';

const HelloMessage = ({ name }: { name: string }): h.JSX.Element => {
  const style = observable('transition-colors duration-500 ease-in-out');
  hooks.onAttach(() => {
    // Simulate async call that takes some time...
    setTimeout(() => {
      style(`${style()} bg-orange-400`);
    }, 100);
  });
  hooks.onDetach(() => {});
  return <span class={style}>Hello "{name}"</span>;
};

export { HelloMessage };
