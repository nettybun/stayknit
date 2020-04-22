import { html, api, observable } from 'sinuous';
import { map } from 'sinuous/map';
import type { Api } from 'sinuous';

// Patch Sinuous' API to trace components into a WeakMap tree
function enableTracing(api: Api) {
  let countInserts = 0;
  const { insert } = api;
  api.insert = (...args) => {
    console.log(++countInserts, 'Insert');
    return insert(...args);
  };
  let countAdds = 0;
  const { add } = api;
  api.add = (...args) => {
    const [parent, value] = args.map(el => {
      if (el instanceof HTMLElement) {
        let str = el.tagName.toLowerCase();
        if (el.className) str += `.${el.className.replace(' ', '.')}`;
        str += ` Kids:${el.childElementCount}`;
        return str;
      }
      if (el instanceof DocumentFragment) {
        return 'Frag';
      }
      return String(el);
    });
    console.log(++countAdds, `Adding "${value}" to <${parent}>`);
    return add(...args);
  };
}
enableTracing(api);

const HelloMessage = ({ name }: { name: string }) => html`
  <span>Hello ${name}</span>
`;

// This can't be a document fragment, it needs to be mountable
const messages = observable([]);

const addMessage = (text: string) => {
  const list = messages();
  list.push(text);
  messages(list);
};

setTimeout(() => {
  addMessage('Everyone');
}, 1000);

setTimeout(() => {
  addMessage('Friends');
}, 2000);

const NavBar = ({ items }: { items: string[] }) => html`
  <div class="flex mb-2 border-t border-r border-l text-sm rounded">
    ${items.map(text => html`
        <a
          class="flex-1 text-center px-4 py-2 border-b-2 bg-white hover:bg-gray-100 hover:border-purple-500"
          onClick=${() => addMessage(text)}
        >
          ${text}
        </a>
      `)}
  </div>
`;

const LoginForm = () => {
  const Item = ({ name, error }: { name: string; error: string }) => html`
    <div class="mb-3">
      <label class="block text-grey-darker text-sm font-bold mb-2" for="username">
        ${name}
      </label>
      <input
        class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
        id="username"
        type="text"
        placeholder=${
          name !== 'Password'
            ? name
            : '*****'
        }
      />
      ${error
        && html`<p class="mt-3 text-red-400 text-xs italic">${error}</p>`}
    </div>
  `;
  return html`
    <div class="mb-6">
      <${Item} name=Username />
      <${Item} name=Password error="Please choose a password" />
      <button class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded" type="button">
        Sign In
      </button>
    </div>
  `;
};

const Page = () => html`
  <main class="bg-purple-100 antialiased justify-center p-8">
    <${NavBar} items=${['Docs', 'Plugins', 'Features', 'Blog']} />
    <section>
      <${LoginForm} />
    </section>
    <div class="antialiased max-w-s mx-auto">
      <div class="flex flex-col">
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            class="form-checkbox
            text-pink-600"
            checked
          />
          <span class="ml-2">Pink Checkbox</span>
        </label>
        <label class="inline-flex items-center">
          <input
            type="radio"
            class="form-radio text-red-600"
            checked
          />
          <span class="ml-2">Red Radio</span>
        </label>
        <label class="inline-flex items-center">
          <input
            type="radio"
            class="form-radio text-green-600"
          />
          <span class="ml-2">Green Radio</span>
        </label>
      </div>
    </div>
    <ul>
    <!-- TODO: Why is "index" wrong and go from 1 to 3 -->
    ${map(messages, (text, index) =>
        // TODO: Is this cached? In htm's statics cache?
        html` <li>${index + 1}. <${HelloMessage} name=${text} /></li>`
    )}
    </ul>
  </main>
`;

const { body } = document;
body.insertBefore(Page(), body.firstChild);
