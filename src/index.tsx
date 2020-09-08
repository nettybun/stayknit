import { h, api, when } from './sinuous.js';
import { css, snippets } from 'styletakeout.macro';

import { messages, count, addMessage, route } from './state.js';

import { AttachTest } from './components/cAttachTest.js';
import { HelloMessage } from './components/cHelloMessage.js';
import { HeartIcon } from './components/cIcon.js';
import { Link } from './components/cLink.js';
import { LoginForm } from './components/cLoginForm.js';
import { NavBar } from './components/cNavBar.js';

import { styles } from './styles.js';
import { stripIndent } from './util.js';

const Page = () =>
  <main class={`${styles.Page} space`}>
    <h1 class={css`${snippets.text.xl_4}`}>Hi 🌺</h1>
    <p>This is a testing page for <Link to="https://sinuous.dev" name="Sinuous"/>. You'll need a modern browser. It's all ESM modules and no transpilation. I'm on Firefox 72.</p>
    <p>I've added onAttach/onDetach lifecycles for components so they can run code once they're added to the page, even if that's long after they're created. It uses WeakMaps.</p>
    <p><strong>Open your browser's console to see the application tracing</strong></p>
    <p>The source code is here: <Link to="https://gitlab.com/nthm/sinuous-packages"/>. This testing page has its source here: <Link to="https://gitlab.com/nthm/stayknit"/>.</p>
    <p>The packages are pluggable, and I've tried to make it easy to extend the functionality. Some example plugins you could write: gather render timing information; re-render counts; or showing a warning when a component hits a certain number of child elements.</p>
    <NavBar items={['Add A', 'Add B', 'Add C', 'Add D', 'Add E']} />
    <p>Below the content is rendered as a <code>`when()`</code> block</p>
    {when(() => route(), {
      A: routeA,
      B: routeB,
    })}
    <HelloMessage name="This is a <HelloMessage/> component"/>
    <p>Below, a list of HelloMessage components are being rendered like this:</p>
    <pre class={styles.CodeBlock}>
      {'() => messages().map(x => <p><HelloMessage name={x}/></p>)'}
    </pre>
    <p>Each time a message is added, all old components are removed (causes onDetach) and new components are created from scartch and added (onAttach).</p>
    <div>{
      when(() => count() === 0 ? '0' : count() < 10 ? '0..10' : '>= 10', {
        '0':     () => <p>There's no messages right now</p>,
        '0..10': () => <p>There's {count} messages; which is less than ten...</p>,
        '>= 10': () => <p><em>Passed 10!</em> There's {count} messages</p>,
      })
    }
    </div>
    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => addMessage(String(count() + 1))}
    >
      Add message
    </button>
    <div>
      {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
    </div>
  </main>;

const routeA = () =>
  <section class={`${styles.DashBorderBlue} space`}>
    <div class={css`display: flex; justify-content: center;`}>
      <HeartIcon />
    </div>
    <p class={css`text-align: center;`}>
      The heart icon is an SVG that's rendered (in JSX) via <code>api.s</code>
    </p>
    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => route('B')}
    >
      Remove blue dashed content via <code>`when()`</code>
    </button>
    <p>There's {() => `${count()} message${count() === 1 ? '' : 's'}`} right now</p>
    <LoginForm />
    <p>This component below will be removed after 5 messages are in the list</p>
    <p>This is the logic:</p>
    <pre class={styles.CodeBlock}>{stripIndent(`
      when(() => count() < 5 ? 'T' : 'F', {
        T: () => <span><AttachTest/></span>,
        F: () => <em>Gone</em>,
      })
      `)}
    </pre>
    {when(() => count() < 5 ? 'T' : 'F', {
      T: () => <span><AttachTest/></span>,
      F: () => <em>Gone</em>,
    })}
  </section>;

const routeB = () =>
  <div class={`${styles.DashBorderBlue} space`}>
    <p>Gone. You can restore the content (cached!)</p>
    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => route('A')}
    >
      Restore via <code>`when()`</code>
    </button>
  </div>;

api.add(document.body, <Page/>, document.body.firstChild as Node);
