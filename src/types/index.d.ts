// This is mostly to support SSR

import type { h, JSX } from 'sinuous';
import type { Observable } from 'sinuous/observable';

type JSXProp =
  | JSX.HTMLAttributes &
    Record<string, unknown>
  | null

// EDIT: This was the wrong type... Components should be able to return null to
// say they don't have anything. That's common in React
type JSXEl = h.JSX.Element | null;
type ObservableRefs = { [k: string]: Observable<unknown> }

declare global {
  interface Window {
    hydrating?: boolean;
  }
  // Component that declare `C.hydrate = C` will return only their state on
  // hydration after SSR

  // What about...passing in an object that the component passively writes into
  // during SSR so I don't need to tap into observable/src at all because
  // there's reassurance that the used observables will be populated

  // I'll lie to TS a bit. This definition will be for client JS only. In the
  // server I'll pass in a collection object

  interface HydratableComponent {
    (props: JSXProp & { children?: never }): JSXEl
    hydrations: ObservableRefs
  }

  // XXX: Why aren't there are type hints for this? Using `props` is `any` type
  // type Component =
  //   | ((props: JSXProp, hy?: unknown) => JSXEl)
  //   | ((props: JSXProp, hy: ObservableRefs) => void)

  // XXX: Self-referencing hydrate function
  // XXX: "MyComp can't be used as a JSX element" (as ObservableRefs isn't assignable)
  // type Component =
  //   | { (props: JSXProp): JSXEl, hydrate: never }
  //   | { (props: JSXProp): JSXEl | ObservableRefs, hydrate: Component }

  // XXX: Requires passing a <T> and MyComp: <typeof MyComp> references itself
  // interface C<T> {
  //   (props: JSXProp):
  //     T extends { hydrate: C<T> }
  //       ? JSXEl | ObservableRefs
  //       : JSXEl
  // }

  // XXX: Can't overload interfaces...
  // interface C {
  //   (props: JSXProp): JSXEl
  // }
  // interface C {
  //   (props: JSXProp): JSXEl | { [k: string]: Observable<unknown> }
  //   hydrate: C
  // }
}

export { JSXProp, JSXEl, ObservableRefs };
