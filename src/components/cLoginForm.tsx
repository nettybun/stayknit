import { h, when } from '/web_modules/haptic';
import { s, computed } from '/web_modules/haptic/s';
import { css, decl, snippets, colours, sizes } from 'styletakeout.macro';

import { lifecycles } from '../lifecycles.js';

import { inSSR } from '../util.js';
import { addMessage } from '../state.js';
import { styles } from '../styles.js';

const LoginForm = () => {
  type Name = 'Username' | 'Password';
  const state = {
    username: s(''),
    password: s(''),
  };

  const Item = ({ name, emptyMessage }: { name: Name; emptyMessage?: string }) => {
    const id = name.toLowerCase() as 'username' | 'password';
    const count = computed(() => state[id]().length);
    const hasTyped = s(false);

    // XXX: This is only an example that you can nest components. I don't
    // recommend it! It's too much closure overhead to think about...
    const DisappearingMessage = ({ text }: { text: string }) => {
      const transitionStyle = css`
        transition-timing-function: linear;
        transition-property: width;
        transition-duration: 3000ms;
        width: 100%;
        height: 2px;
        background-color: ${colours.red._600};
      `;
      const emptyLoaderStyle = s(transitionStyle);

      let timeout: NodeJS.Timeout;
      lifecycles.onAttach(() => {
        // Here the _child_ asks the _parent_ to unmount itself (!!!)
        timeout = setTimeout(() => hasTyped(false), 3000);
        // rAF() and sT() both don't seem to be enough so add 10ms
        setTimeout(() => emptyLoaderStyle(`${transitionStyle} ${css`width: 0;`}`), 10);
      });
      lifecycles.onDetach(() => {
        clearTimeout(timeout);
      });
      return (
        <div class={css`
          display: inline-block;
          margin-top: ${sizes._02};
          background-color: ${colours.red._300};
          `}>
          <p class={css`
            color: #fff;
            font-style: italic;
            padding: ${sizes._01} ${sizes._03} 4px;
            ${snippets.text.xs}
          `}>
            {text}
          </p>
          <div class={emptyLoaderStyle}/>
        </div>
      );
    };

    // SSR
    if (inSSR) lifecycles.saveSignals({ count });
    else if (window.hydrating) return null;

    return (
      <div class={css`margin-bottom: ${sizes._04};`}>
        <label
          // "block text-grey-darker text-sm font-bold mb-2"
          class={css`
            display: block;
            color: ${colours.gray._700};
            margin-bottom: ${sizes._02};
            font-weight: bold;
            ${snippets.text.sm}
          `}
          htmlFor={id}>
          {name} ({count} chars)
        </label>
        <input
          // "shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
          class={css`
            width: 100%;
            padding: ${sizes._02} ${sizes._03};
            color: ${colours.gray._700};
            border-width: 2px;
            &:focus {
              border-color: ${colours.purple._300};
            }
          `}
          id={id}
          type="text"
          placeholder={
            name !== 'Password'
              ? name
              : '*****'
          }
          onKeyUp={ev => {
            hasTyped(true);
            // @ts-ignore
            state[id](ev.target.value);
          }}/>
        {emptyMessage
          && (() => (count() === 0 && hasTyped())
            && <DisappearingMessage text={emptyMessage}/>)
        }
      </div>
    );
  };

  // SSR
  if (inSSR) lifecycles.saveSignals(state);
  else if (window.hydrating) return null;

  return (
    <div>
      <Item name="Username"/>
      <Item name="Password" emptyMessage="Please choose a password"/>
      <button
        class={styles.ButtonBlue}
        type="button"
        onClick={() => addMessage(`${state.username()} & ${state.password()}`)}>
        Add user/pass fields as a message
      </button>
    </div>
  );
};

export { LoginForm };
