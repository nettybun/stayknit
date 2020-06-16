// This is mostly to support SSR

import type { h, JSX } from 'sinuous';
import type { ElementChildren } from 'sinuous/shared';
import type { Observable } from 'sinuous/observable';

type JSXProp =
  | JSX.HTMLAttributes &
    Record<string, unknown>
  | null;

type JSXEl = h.JSX.Element;
type ObservableCollection = { [k: string]: Observable<unknown> }

declare global {
  interface Window {
    hydrating?: boolean;
  }
  // Component that declare `C.hydrate = C` will return only their state on
  // hydration after SSR

  type Component = {
    (props: JSXProp, ...children: ElementChildren[]): JSXEl
    hydrate: (props: JSXProp, ...children: ElementChildren[]) => ObservableCollection
  }

  // XXX: Self-referencing hydrate function
  // XXX: "MyComp can't be used as a JSX element" (as ObservableRefs isn't assignable)
  // type Component =
  //   | { (props: JSXProp, ...children: ElementChildren[]): JSXEl, hydrate: never }
  //   | { (props: JSXProp, ...children: ElementChildren[]): JSXEl | ObservableCollection, hydrate: Component }

  // XXX: Requires passing a <T> and MyComp: <typeof MyComp> references itself
  // interface C<T> {
  //   (props: JSXProp, ...children: ElementChildren[]):
  //     T extends { hydrate: C<T> }
  //       ? JSXEl | ObservableCollection
  //       : JSXEl
  // }

  // XXX: Can't overload interfaces...
  // interface C {
  //   (props: JSXProp, ...children: ElementChildren[]): JSXEl
  // }
  // interface C {
  //   (props: JSXProp, ...children: ElementChildren[]): JSXEl | { [k: string]: Observable<unknown> }
  //   hydrate: C
  // }
}

export { ObservableCollection };
