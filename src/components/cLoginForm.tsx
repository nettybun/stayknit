import { h, hooks } from '../sinuous.js';
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

  const Item = ({ name, error }: { name: Name; error?: string }) => {
    const id = name.toLowerCase() as 'username' | 'password';
    const count = computed(() => s[id]().length);
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
          onInput={ev => {
            // TODO: This is nuts.
            const { target }: { target: EventTarget & { value?: string } | null } = ev;
            if (target?.value) s[id](target.value);
          }}
        />
        {error && (
          <p class={css`
              margin: ${decl.size._02} 0;
              color: ${decl.colour.red._400};
              font-style: italic;
              ${snippets.text.xs}
            `}
          >
            {error}
          </p>
        )}
      </div>
    );
  };

  // SSR
  if (inSSR) hooks.saveObservables(s);
  else if (window.hydrating) return null;

  return (
    <div>
      <Item name="Username" />
      <Item name="Password" error="Please choose a password" />
      <button
        class={styles.ButtonBlue}
        type="button"
        onClick={() => addMessage(`${s.username()} & ${s.password()}`)}
      >
        Add items to message list
      </button>
    </div>
  );
};

export { LoginForm };
