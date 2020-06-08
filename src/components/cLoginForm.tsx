import { h, o } from 'sinuous';
import { addMessage } from '../data/messages';
import { subscribe, computed } from 'sinuous/observable';

const LoginForm = () => {
  type Name = 'Username' | 'Password';
  const state = {
    username: o(''),
    password: o(''),
  };

  const Item = ({ name, error }: { name: Name; error?: string }) => {
    const id = name.toLowerCase() as 'username' | 'password';
    const count = computed(() => state[id]().length);
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
            if (target?.value) state[id](target.value);
          }}
        />
        {error
        && <p class="mt-3 text-red-400 text-xs italic">{error}</p>}
      </div>
    );
  };

  return (
    <div class="mb-6">
      <Item name="Username" />
      <Item name="Password" error="Please choose a password" />
      <button
        class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
        type="button"
        onClick={() => addMessage(`${state.username()} & ${state.password()}`)}
      >
        Save
      </button>
    </div>
  );
};

export { LoginForm };
