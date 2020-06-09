import { h, api } from 'sinuous';
import { observable, subscribe } from 'sinuous/observable';
import { map } from 'sinuous/map';

import { trace, tree } from './trace/index';
import { messages } from './data/messages';

import { LoginForm } from './components/cLoginForm';
import { NavBar } from './components/cNavBar';
import { MountTest } from './components/cMountTesting';

// Middleware for h() and add/insert calls
trace(api);

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
    <svg class="bi bi-heart" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z" clip-rule="evenodd"/>
    </svg>
  );

const ListUsingMap = () =>
  <ul>
    {map(messages, (text) =>
      <li class=""><HelloMessage name={text} /></li>
    )}
  </ul>;

const renderSwapA = <MountTest/>;
const renderSwapB = <em>Gone</em>;
const renderSwapMarker = document.createTextNode('');

const Page = () =>
  <main class="bg-purple-100 antialiased justify-center p-8">
    <NavBar items={['Docs', 'Plugins', 'Features', 'Blog']} />
    <section>
      <HeartIcon />
      <p>This is an example of a function that's not a component</p>
      <p>There's {() => {
        const x = messages().length;
        return `${x} message${x === 1 ? '' : 's'}`;
      }} right now
      </p>
      <LoginForm />
      {renderSwapMarker}
    </section>
    <HelloMessage name="I'm not in the messages() array"/>
    {/* <ListUsingMap /> */}
    {() => messages().map(x => <p><HelloMessage name={x}/></p>)}
  </main>;

api.add(document.body, <Page/>, document.body.firstChild as Node);

// If this is actually the only way to leave elements alive during ternary calls
// then it's a great usecase for onAttach
subscribe(() => {
  const parent = renderSwapMarker.parentElement;
  if (!parent) throw 'No parent for renderSwapMarker';

  if (messages().length < 5) {
    if (renderSwapB.isConnected)
      api.rm(parent, renderSwapB, renderSwapMarker);
    if (!renderSwapA.isConnected)
      api.add(parent, renderSwapA, renderSwapMarker);
  } else {
    if (renderSwapA.isConnected)
      api.rm(parent, renderSwapA, renderSwapMarker);
    if (!renderSwapB.isConnected)
      api.add(parent, renderSwapB, renderSwapMarker);
  }
});
