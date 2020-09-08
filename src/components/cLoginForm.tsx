import { h, hooks, when } from '../sinuous.js';
import { o, computed } from 'sinuous/observable';
import { css, decl, snippets, colours, sizes } from 'styletakeout.macro';

import { inSSR } from '../util.js';
import { addMessage } from '../state.js';
import { styles } from '../styles.js';

const LoginForm = (): h.JSX.Element | null => {
  type Name = 'Username' | 'Password';
  const s = {
    username: o(''),
    password: o(''),
  };

  const Item = ({ name, emptyMessage }: { name: Name; emptyMessage?: string }) => {
    const id = name.toLowerCase() as 'username' | 'password';
    const count = computed(() => s[id]().length);
    let hasTyped = false;

    // SSR
    if (inSSR) hooks.saveObservables({ count });
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
          htmlFor={id}
        >
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
            hasTyped = true;
            // @ts-ignore
            s[id](ev.target.value);
          }}
        />
        {emptyMessage
          && (
            () => count() === 0 && hasTyped && (
              <p class={css`
                margin-top: ${sizes._02};
                padding-left: ${sizes._03};
                color: ${colours.red._400};
                border-left: 2px solid ${colours.red._400};
                font-style: italic;
                ${snippets.text.xs}
              `}
              >
                {emptyMessage}
              </p>
            )
          )
        }
      </div>
    );
  };

  // SSR
  if (inSSR) hooks.saveObservables(s);
  else if (window.hydrating) return null;

  return (
    <div>
      <Item name="Username" />
      <Item name="Password" emptyMessage="Please choose a password" />
      <button
        class={styles.ButtonBlue}
        type="button"
        onClick={() => addMessage(`${s.username()} & ${s.password()}`)}
      >
        Add user/pass fields as a message
      </button>
    </div>
  );
};

export { LoginForm };
