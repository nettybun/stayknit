import { h, api, when } from './sinuous.js';
import { observable } from 'sinuous/observable';
// TODO: This is huge at 16.7kb... I only ever need a stripIndent
import { codeBlock } from 'common-tags';

import { messages, count, addMessage } from './state/messages.js';

import { AttachTest } from './components/cAttachTest.js';
import { HelloMessage } from './components/cHelloMessage.js';
import { HeartIcon } from './components/cIcon.js';
import { Link } from './components/cLink.js';
import { LoginForm } from './components/cLoginForm.js';
import { NavBar } from './components/cNavBar.js';

import { sharedStyles } from './styles.js';

const view = observable('WhenViewA');

const Page = () =>
  <main class={sharedStyles.Page}>
    <h1 class="text-4xl">Hi 🌺</h1>
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
        <section class={`mb-5 ${sharedStyles.DashBorderBlue}`}>
          <div class="flex justify-center">
            <HeartIcon />
          </div>
          <p class="m-4 w-3/4 mx-auto text-center">
            The heart icon is an SVG that's rendered (in JSX) via <code>api.s</code>
          </p>
          <button
            class={sharedStyles.ButtonBlue}
            type="button"
            onClick={() => view('WhenViewB')}
          >
            Remove blue dashed content via <code>`when()`</code>
          </button>
          <p>There's {() => `${count()} message${count() === 1 ? '' : 's'}`} right now</p>
          <LoginForm />
          <p>This component below will be removed after 5 messages are in the list</p>
          <p>This is the logic:</p>
          <pre class={`text-xs ${sharedStyles.CodeBlock}`}>
            {codeBlock`
              when(() => count() < 5 ? 'T' : 'F', {
                T: () => <span><AttachTest/></span>,
                F: () => <em>Gone</em>,
              })`}
          </pre>
          {when(() => count() < 5 ? 'T' : 'F', {
            T: () => <span><AttachTest/></span>,
            F: () => <em>Gone</em>,
          })}
        </section>,
      WhenViewB: () =>
        <div class={`mb-5 ${sharedStyles.DashBorderBlue}`}>
          <p>Gone. You can restore the content (cached!)</p>
          <button
            class={`${sharedStyles.ButtonBlue} mt-4`}
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
      <pre class={`text-xs my-5 p-5 ${sharedStyles.CodeBlock}`}>
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
      class={sharedStyles.ButtonBlue}
      type="button"
      onClick={() => addMessage(String(count() + 1))}
    >
      Add message
    </button>
    <div>
      {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
    </div>
  </main>;

api.add(document.body, <Page/>, document.body.firstChild as Node);
