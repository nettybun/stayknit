import { h, hooks } from '../sinuous.js';
import { o, computed } from 'sinuous/observable';
import { css, decl } from 'styletakeout.macro';

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
      <div class="my-3">
        <label
          class="block text-grey-darker text-sm font-bold mb-2" htmlFor={id}
        >
          {name} ({count} chars)
        </label>
        <input
          class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
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
          // Hmm... Not a huge fan of classes mixed with css``...
          <p class={`text-xs ${css`
              margin-top: ${decl.size._03};
              color: ${decl.colour.red._400};
              font-style: italic;
              /* Might be better to have a snippet "decl.text.xs" */
            `}`}
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
    <div class="mb-6">
      <Item name="Username" />
      <Item name="Password" error="Please choose a password" />
      <button
        class={styles.ButtonBlue}
        type="button"
        onClick={() => addMessage(`${s.username()} & ${s.password()}`)}
      >
        Add fields to message list
      </button>
    </div>
  );
};

export { LoginForm };
