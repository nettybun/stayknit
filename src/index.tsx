import { observable, api, h as hClean } from 'sinuous';
import { map } from 'sinuous/map';
import { traceH, traceAPI } from './tracing';

const h = traceH(hClean);
traceAPI(api);

const HelloMessage = ({ name }: { name: string }) => (
  <span>Hello {name}</span>
);

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

const Page = () =>
  <main className="bg-purple-100 antialiased justify-center p-8">
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
      {/* TODO: Why is "index" wrong and go from 1 to 3 */}
      {map(messages, (text, index) =>
        <li>{index + 1}. <HelloMessage name={text} /></li>
      )}
    </ul>
  </main>;

const { body } = document;
body.insertBefore(Page(), body.firstChild);
