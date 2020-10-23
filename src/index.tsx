import { h, api, when } from '/web_modules/haptic';
import { css, snippets, sizes } from 'styletakeout.macro';

import { lifecyclesInstall } from './lifecycles.js';
import { messages, count, addMessage, route, svgSize } from './state.js';

import { AttachTest } from './components/cAttachTest.js';
import { HelloMessage } from './components/cHelloMessage.js';
import { HeartIcon } from './components/cIcon.js';
import { Link } from './components/cLink.js';
import { LoginForm } from './components/cLoginForm.js';
import { NavBar } from './components/cNavBar.js';

import { styles } from './styles.js';
import { stripIndent } from './util.js';

lifecyclesInstall();

const Page = () =>
  <main class={`${styles.Page} space`}>
    <h1 class={css`font-weight: 400; ${snippets.text.xl_4}`}>Hi 🌺</h1>

    <p>This is a testing page for <Link to="https://sinuous.dev" name="Sinuous"/>. You'll need a modern browser. It's all ESM modules and no JS transpilation except JSX.</p>

    <p>I've been working on projects that work with Sinuous. One is adding onAttach/onDetach lifecycles for components so they can run code once they're added to the DOM, even if that's long after they're created. It uses WeakMaps.</p>

    <p><strong>Open your browser's console to see the application tracing</strong></p>

    <p>The source code is here: <Link to="https://gitlab.com/nthm/sinuous-packages"/>. This testing page has its source here: <Link to="https://gitlab.com/nthm/stayknit"/>.</p>

    <p>The packages are pluggable, and I've tried to make it easy to extend the functionality. Some example plugins you could write: gather render timing information; re-render counts; or showing a warning when a component hits a certain number of child elements.</p>

    <p>Another package is <em>styletakeout.macro</em> which is a true-zero overhead compile-time CSS-in-JS library. This page is written in it. I wrote it to replace Tailwind CSS.</p>

    <p>Lastly there's <em>SoftDOM</em> which does server side rendering. It actually can render this page! Here's the output at <Link to="indexSSR.html"/>. Compare its source (Ctrl+U) to the non-SSR version.</p>

    <h2 style={`margin-top: ${sizes._10}; margin-bottom: ${sizes._02}`}>Demos</h2>

    <p>Here are some demos of content, logic, and styling. Below the content is rendered as a <code>`when()`</code> block, like this:</p>
    <pre class={styles.CodeBlock}>{stripIndent(`
      when(() => route(), {
        A: routeA,
        B: routeB,
      })
    `)}
    </pre>
    {when(() => route(), {
      A: routeA,
      B: routeB,
    })}

    <p>This is now outside of the router content. Let's talk about state and counting. To help illustrate this, we'll count <code>{'<HelloMessage/>'}</code> components. Here's one now:</p>

    <HelloMessage name="This is a <HelloMessage/> component"/>

    <p>These are a lil special because they use <code>onAttach</code> and <code>onDetach</code> hooks. The pink background <em>only</em> appears when the component has been mounted. It fades in.</p>

    <p>Below, a list of these components are being rendered:</p>

    <pre class={styles.CodeBlock}>
      {'() => messages().map(x => <p><HelloMessage name={x}/></p>)'}
    </pre>

    <p>Because this uses a simple <code>[].map()</code>, each time a message is added all old components are removed (calling their respective onDetach) and new components are created and added to the DOM (calling onAttach).</p>

    <p>Let's also do one last neat <code>when()</code> block:</p>
    <pre class={styles.CodeBlock}>{stripIndent(`
      when(() => count() === 0 ? '0' : count() < 10 ? '0..10' : '>= 10', {
        '0':     () => <p>There's no messages right now</p>,
        '0..10': () => <p>There's {count} messages; which is less than ten...</p>,
        '>= 10': () => <p><em>Passed 10!</em> There's {count} messages</p>,
      })
    `)}
    </pre>
    <p>It looks a little complex, but it's pretty intuitive to read. Here's the output:</p>
    <div>
      {
        when(() => count() === 0 ? '0' : count() < 10 ? '0..10' : '>= 10', {
          '0':     () => <p>There's no messages right now</p>,
          '0..10': () => <p>There's {count} messages; which is less than ten...</p>,
          '>= 10': () => <p><em>Passed 10!</em> There's {count} messages</p>,
        })
      }
    </div>

    <p>Play with the page's reactivity by adding and clearing some messages! Lots of the page updates, like the heart icon mentioned earlier.</p>

    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => addMessage(String(count() + 1))}>
      Add message
    </button>

    <button
      class={`${styles.ButtonBlue} ${css`margin-left: 5px;`}`}
      type="button"
      onClick={() => messages([])}>
      Clear all
    </button>

    <section class={styles.DashBorderBlue}>
      {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
    </section>
  </main>;

const routeA = () =>
  <section class={`${styles.DashBorderBlue} space`}>
    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => route('B')}>
      Swap to route "B"
    </button>
    <div class={css`display: flex; justify-content: center;`}>
      <HeartIcon size={svgSize}/>
    </div>
    <p class={css`text-align: center;`}>The heart icon is an SVG that's rendered (in JSX) via <code>api.s</code>.<br/>It grows with how many messages there are.</p>

    <p>There's {() => `${count()} message${count() === 1 ? '' : 's'}`} right now</p>

    <p>Here's a <code>{'<LoginForm/>'}</code> component that also writes to the list of messages</p>

    <LoginForm/>

    <p>There's a blue component below called <code>{'<AttachTest/>'}</code> that will be removed after 5 messages are in the list</p>

    <p>This is the logic:</p>

    <pre class={styles.CodeBlock}>{stripIndent(`
      when(() => count() < 5 ? 'T' : 'F', {
        T: () => <span><AttachTest/></span>,
        F: () => <em>Gone</em>,
      })
      `)}
    </pre>

    <p>Here's count: {count}</p>

    {when(() => count() < 5 ? 'T' : 'F', {
      T: () => <span><AttachTest/></span>,
      F: () => <em>Gone</em>,
    })}
  </section>;

const routeB = () =>
  <div class={`${styles.DashBorderBlue} space`}>
    <p>Gone. This is now route B</p>
    <p>Here's some content to play with while you're here. Each button adds a message. When you go back to route A, the heart will be bigger.</p>
    <NavBar items={['Add A', 'Add B', 'Add C', 'Add D', 'Add E']}/>
    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => route('A')}>
      Restore "A"
    </button>
  </div>;

// api.h = (tag, ...args) => {
//   const functions: Array<() => unknown> = [];
//   if (typeof tag === 'function') {
//     console.group('Tag call:', tag.name);
//     const fromTag = tag(...args);
//     console.log('From tag:', fromTag);
//     // @ts-ignore
//     functions.push(fromTag);
//     console.groupEnd();
//   } else {
//     const toSearch = [...args];
//     while (toSearch.length) {
//       console.log(toSearch);
//       const x = toSearch.shift();
//       if (typeof x === 'function') {
//         // @ts-ignore
//         if (x.$o) {
//           console.log('DOM observable:', x.name);
//         }
//         functions.push(x as () => unknown);
//         console.log('Argument call:', x.toString());
//         x();
//       }
//       else if (typeof x === 'object' && x !== null) {
//         console.log('Add object');
//         // @ts-ignore
//         Object.values(x).forEach(y => toSearch.push(y));
//       }
//     }
//   }
//   return functions;
// };
// console.log(<Page/>);
api.add(document.body, <Page/>, document.body.firstChild as Node);
