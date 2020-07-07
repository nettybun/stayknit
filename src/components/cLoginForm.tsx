import { h, hooks } from '../sinuous.js';
import { o, computed } from 'sinuous/observable';
import { inSSR } from '../util.js';
import { addMessage } from '../state/messages.js';

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
        {error
        && <p class="mt-3 text-red-400 text-xs italic">{error}</p>}
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
        class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4"
        type="button"
        onClick={() => addMessage(`${s.username()} & ${s.password()}`)}
      >
        Add fields to message list
      </button>
    </div>
  );
};

export { LoginForm };
