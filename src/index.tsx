import { h, svg, api, when } from './sinuous.js';
import { observable } from 'sinuous/observable';
import { map } from 'sinuous/map';
import { css } from 'styletakeout.macro';

import { messages, count, addMessage } from './state/messages.js';
import { svgSize } from './state/svgSize.js';

import { HelloMessage } from './components/cHelloMessage.js';
import { LoginForm } from './components/cLoginForm.js';
import { NavBar } from './components/cNavBar.js';
import { AttachTest } from './components/cAttachTest.js';

import { styles } from './styles.js';

const HeartIcon = () =>
  svg(() =>
    <svg width={svgSize} height={svgSize} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z" clip-rule="evenodd"/>
    </svg>
  );

const ListUsingMap = () =>
  <ul>
    {map(messages, (text) =>
      <li class=""><HelloMessage name={text} /></li>
    )}
  </ul>;

const Link = ({ to, name }: { to: string, name?: string }) =>
  <a class={styles.Link} href={to}>{name ?? to}</a>;

const view = observable('WhenViewA');

const Page = () =>
  <main class={styles.Page}>
    <h1 class={`${styles.t.xl4}`}>Hi 🌺</h1>
    <p>
      This is a testing page for <Link to="https://sinuous.dev" name="Sinuous"/>. You'll need a
      modern browser. It's all ESM modules and no transpilation. I'm on Firefox 72.
    </p>
    <p>
      I've added onAttach/onDetach lifecycles for components so they can run code once they're added
      to the page, even if that's long after they're created. It uses WeakMaps.
    </p>
    <p><strong>Open your browser's console to see the application tracing</strong></p>
    <p>
      The source code is here: <Link to="https://gitlab.com/nthm/sinuous-packages"/>. This testing
      page has its source here: <Link to="https://gitlab.com/nthm/stayknit"/>.
    </p>
    <p>
      The packages are pluggable, and I've tried to make it easy to extend the functionality. Some
      example plugins you could write: gather render timing information; re-render counts; or
      showing a warning when a component hits a certain number of child elements.
    </p>
    <NavBar items={['Add A', 'Add B', 'Add C', 'Add D', 'Add E']} />
    <p>Below the content is rendered as a <code>`when()`</code> block</p>
    {when(() => view(), {
      WhenViewA: () =>
        <section class="mb-5 border-dashed border-2 border-blue-500">
          <div class="flex justify-center">
            <HeartIcon />
          </div>
          <p class="m-4 w-3/4 mx-auto text-center">
            The heart icon is an SVG that's rendered (in JSX) via <code>api.s</code>
          </p>
          <button
            class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 mb-4"
            type="button"
            onClick={() => view('WhenViewB')}
          >
            Remove blue dashed content via <code>`when()`</code>
          </button>
          <p>There's {() => {
            const x = messages().length;
            return `${x} message${x === 1 ? '' : 's'}`;
          }} right now
          </p>
          <LoginForm />
          <p>This component below will be removed after 5 messages are in the list</p>
          <p>This is the logic:</p>
          <pre class="text-xs bg-gray-200 my-5 p-5 overflow-x-auto">
            {`
when(() => count() < 5 ? 'T' : 'F', {
  T: () => <span><AttachTest/></span>,
  F: () => <em>Gone</em>,
})
            `.trim()}
          </pre>
          {when(() => count() < 5 ? 'T' : 'F', {
            T: () => <span><AttachTest/></span>,
            F: () => <em>Gone</em>,
          })}
        </section>,
      WhenViewB: () =>
        <div class="mb-5 border-dashed border-2 border-blue-500">
          <p>Gone. You can restore the content (cached!)</p>
          <button
            class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 mt-4"
            type="button"
            onClick={() => view('WhenViewA')}
          >
            Restore via <code>`when()`</code>
          </button>
        </div>,
    })}
    <HelloMessage name="This is a <HelloMessage/> component"/>
    <div class="my-5">
      <p>Below, a list of HelloMessage components are being rendered like this:</p>
      <pre class="text-xs bg-gray-200 my-5 p-5 overflow-x-auto">
        {'() => messages().map(x => <p><HelloMessage name={x}/></p>)'}
      </pre>
      <p>
        Each time a message is added, all old components are removed (causes onDetach) and new
        components are created from scartch and added (onAttach).
      </p>
    </div>
    <div>{
      when(() => count() === 0 ? '0' : count() < 10 ? '0..10' : '>= 10', {
        '0':
          () => <p>There's no messages right now</p>,
        '0..10':
          () => <p>There's {count} messages; which is less than ten...</p>,
        '>= 10':
          () => <p><em>Passed 10!</em> There's {count} messages</p>,
      })
    }
    </div>
    <button
      class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4"
      type="button"
      onClick={() => addMessage(String(messages().length + 1))}
    >
      Message
    </button>
    <div>
      {/* <ListUsingMap /> */}
      {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
    </div>
  </main>;

api.add(document.body, <Page/>, document.body.firstChild as Node);
