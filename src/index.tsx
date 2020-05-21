import { api, h, svgJSX } from 'sinuous';
import { observable, computed, subscribe, sample } from 'sinuous/observable';
import { map } from 'sinuous/map';
import { traceH, traceAPI } from './tracing';

api.h = traceH(api.h);
traceAPI(api);

const HelloMessage = ({ name }: { name: string }) => (
  <span>Hello {name}</span>
);

// This can't be a document fragment, it needs to be mountable
const messages = observable([] as string[]);

const addMessage = (text: string) => {
  const list = messages();
  list.push(text);
  messages(list);
};

const count = observable(0);
const squared = computed(() => Math.pow(count(), 2));

subscribe(() => {
  const x = squared();
  console.log(x);
  // #addMessage(String(x));
  const list = sample(messages);
  list.push(String(x));
  messages(list);
});
// Global
Object.assign(window, { count });

setTimeout(() => {
  addMessage('Everyone');
}, 1000);

setTimeout(() => {
  addMessage('Friends');
}, 2000);

const NavBar = ({ items }: { items: string[] }) =>
  <div className="flex mb-2 border-t border-r border-l text-sm rounded">
    {items.map(text =>
      <a
        className="flex-1 text-center px-4 py-2 border-b-2 bg-white hover:bg-gray-100 hover:border-purple-500"
        onClick={() => addMessage(text)}
      >
        {text}
      </a>
    )}
  </div>;

const LoginForm = () => {
  const Item = ({ name, error }: { name: string; error?: string }) =>
    <div className="mb-3">
      <label className="block text-grey-darker text-sm font-bold mb-2" htmlFor="username">
        {name}
      </label>
      <input
        className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
        id="username"
        type="text"
        placeholder={
          name !== 'Password'
            ? name
            : '*****'
        }
      />
      {error
        && <p className="mt-3 text-red-400 text-xs italic">{error}</p>}
    </div>;

  return (
    <div className="mb-6">
      <Item name="Username" />
      <Item name="Password" error="Please choose a password" />
      <button className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded" type="button">
        Sign In
      </button>
    </div>
  );
};

const HeartIcon = () =>
  svgJSX(() =>
    <svg class="bi bi-heart" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z" clip-rule="evenodd"/>
    </svg>
  );

const Page = () =>
  <main className="bg-purple-100 antialiased justify-center p-8">
    <HeartIcon/>
    <NavBar items={['Docs', 'Plugins', 'Features', 'Blog']} />
    <section>
      <LoginForm />
    </section>
    <div className="antialiased max-w-s mx-auto">
      <div className="flex flex-col">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox text-pink-600"
            checked
          />
          <span className="ml-2">Pink Checkbox</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-red-600"
            checked
          />
          <span className="ml-2">Red Radio</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio text-green-600"
          />
          <span className="ml-2">Green Radio</span>
        </label>
      </div>
    </div>
    <ul>
      {map(messages, (text) =>
        <li><HelloMessage name={text} /></li>
      )}
    </ul>
  </main>;

const { body } = document;
body.insertBefore(Page(), body.firstChild);
