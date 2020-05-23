import { api, h, svgJSX } from 'sinuous';
import { map } from 'sinuous/map';

import { trace } from './trace';
import { messages, addMessage } from './data/messages';

import { LoginForm } from './components/cLoginForm';
import { NavBar } from './components/cNavBar';

// Middleware for h() and add/insert calls
trace(api);

const HelloMessage = ({ name }: { name: string }) => (
  <span>Hello {name}</span>
);

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

setTimeout(() => {
  addMessage('Everyone');
}, 1000);

setTimeout(() => {
  addMessage('Friends');
}, 2000);
