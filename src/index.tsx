import { h, api } from 'sinuous';
import { observable, subscribe, root } from 'sinuous/observable';
import { map } from 'sinuous/map';

import { trace } from './trace/index.js';
import { pluginLifecycles } from './trace/tree-plugin-lifecycle.js';
import { pluginHydrations } from './trace/tree-plugin-hydration.js';

import { messages, addMessage, count } from './state/messages.js';
import { svgSize } from './state/svgSize.js';

import { LoginForm } from './components/cLoginForm.js';
import { NavBar } from './components/cNavBar.js';
import { AttachTest } from './components/cAttachTest.js';

// TODO: When eventually defining a JSX-fork for Sinuous as a local file
// declare namespace JSX {
//   // This forbids children on components that don't declare them explicitly
//   interface IntrinsicAttributes {
//     children?: never;
//   }
// }

// TODO: Place for types? +Things like Object.assign
import type { Tree } from './trace/ds.js';

const tracers = trace(api);
const tree = {} as Tree;
pluginLifecycles(tracers, tree);
pluginHydrations(tracers, tree);
// pluginLogging(tracers);

const when = (
  condition: () => string,
  views: { [k in string]?: () => Element}
) => {
  const rendered: { [k in string]?: Element } = {};
  return () => {
    const cond = condition();
    if (!rendered[cond] && views[cond])
      rendered[cond] = root(() => (views[cond] as () => Element)());
    return rendered[cond];
  };
};

const HelloMessage = ({ name }: { name: string }) => {
  const style = observable('transition-colors duration-500 ease-in-out');
  tree.onAttach(() => {
    // Simulate fetch() call that takes some time...
    setTimeout(() => {
      style(`${style()} bg-orange-400`);
    }, 100);
  });
  return <span class={style}>Hello {name}</span>;
};

const HeartIcon = () =>
  api.hs(() =>
    <svg width={svgSize} height={svgSize} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z" clip-rule="evenodd"/>
    </svg>
  );

const ListUsingMap = () =>
  <ul>
    {map(messages, (text) =>
      <li class=""><HelloMessage name={text} /></li>
    )}
  </ul>;

const Link = ({ to }: {to: string}) =>
  <a href={to}>{to}</a>;

// Styled components with syntax highlighting, error checking, & autogen classes
// const styPage = css`
//   margin-bottom: 10px;
// `;
//
// cssGlobal`
//   body {
//     background-color: #555;
//   }
// `;

const Page = () =>
  <main
    class="bg-purple-100 antialiased justify-center p-8"
    style="max-width: 800px;"
  >
    <h1 class="text-4xl mb-2">Hi</h1>
    <p class="mb-4">
      This is a testing page for <a href='https://sinuous.dev'>Sinuous</a>. You'll need a modern
      browser. It's all ESM modules and no transpilation. I'm on Firefox 72.
    </p>
    <p class="mb-4">
      I've added onAttach/onDetach lifecycles for components so they can run code once they're added
      to the page, even if that's long after they're created. It uses WeakMaps and WeakSets.
    </p>
    <p class="mb-4"><strong>Open your browser's console to see the application tracing</strong></p>
    <p class="mb-4">
      The source code is here: <Link to="https://gitlab.com/nthm/stayknit"/>. The actual algorithm
      for lifecycles is under <em>src/trace/tracerFunctions.tsx</em>
    </p>
    <NavBar items={['A', 'B', 'C', 'D', 'E']} />
    <section>
      <div class="flex justify-center">
        <HeartIcon />
      </div>
      <p class="m-4 w-3/4 mx-auto text-center">
        The heart icon is an SVG that's rendered (in JSX) via <code>api.hs</code>
      </p>
      <p>There's {() => {
        const x = messages().length;
        return `${x} message${x === 1 ? '' : 's'}`;
      }} right now
      </p>
      <LoginForm />
      <p>This component below will be removed after 5 messages are in the list</p>
      {when(() => count() < 5 ? 'T' : 'F', {
        T: () => <AttachTest/>,
        F: () => <em>Gone</em>,
      })}
    </section>
    <HelloMessage name="This is a <HelloMessage/> component"/>
    <div class="my-5">
      <p>Below, a list of HelloMessage components are being rendered like this:</p>
      <pre class="text-xs bg-gray-300 my-5 p-2 overflow-x-auto">
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
          () => <p><em>Damn.</em> There's {count} messages!</p>,
      })
    }
    </div>
    <div class="my-5">
      {/* <ListUsingMap /> */}
      {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
    </div>
  </main>;

api.add(document.body, <Page/>, document.body.firstChild as Node);
