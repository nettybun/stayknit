import type { _h, api } from 'sinuous/h';
import type { El, ComponentName } from './index';

import { ds, callAttachForTree, DATASET_TAG } from './index';
import { type } from './utils';

const refDF: DocumentFragment[] = [];

// Unlike other functions this doesn't throw since it needs to keep rendering
const hTracer = (hCall: typeof _h.h): typeof _h.h =>
  // @ts-ignore DocumentFragment is not assignable to SVGElement | HTMLElement
  (...args: unknown[]) => {
    const [fn] = args;
    if (typeof fn !== 'function') {
      if (Array.isArray(fn)) {
        console.log('hTracer: Creating DocumentFragment');
      }
      // @ts-ignore TS doesn't understand ...args
      const retH = hCall(...args);
      if (retH instanceof DocumentFragment) {
        console.log('hTracer returning DocumentFragment. Has children:', retH.hasChildNodes());
        refDF.push(retH);
      }
      return retH;
    }

    const name = fn.name as ComponentName;
    console.group(`🔶${name}`);
    const data = {};
    ds.renderStack.push(data);
    // @ts-ignore TS incorrectly destructs the overload as `&` instead of `|`
    const el: HTMLElement | SVGElement | DocumentFragment = hCall(...args);
    if (el instanceof DocumentFragment) {
      console.log('hTracer DocumentFragment from component:', name);
    }

    // Match Element and DocumentFragment
    if (el instanceof Node) {
      console.log(`${name}: isComp ✅`);
    } else {
      console.log(`${name}: isComp ❌`);
      ds.renderStack.pop();
      console.groupEnd();
      return el;
    }
    const lifecycles = ds.renderStack.pop();
    // Would only happen if someone writes to the render stack during a render
    if (!lifecycles || lifecycles !== data) {
      console.error(`${name}: ds.renderStack.pop() was empty or wrong object`);
      console.groupEnd();
      return el;
    }
    // Elements become components _after_ all their children have been added...
    // Which means they'll be guardians by then if they had any children
    const elGuard = ds.guardMeta.get(el);
    const children = elGuard?.children ?? new Set<El>();
    if (elGuard) {
      console.log('Upgrading guard to component');
      ds.guardMeta.delete(el);
    }
    ds.compMeta.set(el, { name, children, lifecycles });
    const instances = ds.compNames.get(name) ?? new WeakSet<El>();
    ds.compNames.set(name, instances.add(el));
    // TODO: Support DocumentFragment
    if (!(el instanceof DocumentFragment)) {
      el.dataset[DATASET_TAG] = name;
    }
    console.log(`${name}: Done. Installed lifecycles: ${Object.keys(lifecycles).length}`);
    console.groupEnd();
    return el;
  };

// In Sinuous, api.add is not purely a sub-function of api.h. It will call api.h
// if given an array and then converts it to a fragment internally so we never
// see the fragment. That's why hTracer sets refDF to be used here. It will be
// empty (parent.insertBefore in api.add clears it) but the object ref is OK
const addTracer = (addCall: typeof api.add): typeof api.add =>
  (parent: El, value: El, endMark) => {
    console.group(`api.add(parent:${type(parent)}, value:${type(value)})`);

    const valueWasNotPreviouslyConnected = !value.isConnected;
    const retAdd = addCall(parent, value, endMark);

    // @ts-ignore TS bug says undefined after checking length?
    if (Array.isArray(value) && refDF.length) value = refDF.pop();
    if (!(value instanceof Element || value instanceof DocumentFragment)) {
      console.log(`Not Element or DF: ${type(value)}. Returning`, retAdd);
      console.groupEnd();
      return retAdd;
    }

    const maybeAttach = (): void => {
      const e = (x: boolean) => x ? '✅' : '❌';
      console.log(`Attached? Parent ${e(parent.isConnected)}. Value ${e(!valueWasNotPreviouslyConnected)}`);
      if (parent.isConnected && valueWasNotPreviouslyConnected) {
        console.log('%conAttach', 'background: lightgreen', 'for value');
        callAttachForTree(value);
      }
    };

    // TODO: This could replace all the if/else below? (c: El | Set<El>) =>
    const walkUpToPlaceChildren = (children: Set<El>) => {
      let cursor: El | null = parent;
      // eslint-disable-next-line no-cond-assign
      while (cursor = cursor.parentElement) {
        console.log('Trying', type(cursor));
        const container = ds.compMeta.get(cursor) ?? ds.guardMeta.get(cursor);
        if (container) {
          console.log(`Found ${type(cursor)}`);
          // If (children instanceof Set) || container.children.add(children);
          children.forEach(x => container.children.add(x));
          break;
        }
        // Didn't find a component or guard walking up tree. Default to <body/>
        if (cursor === document.body) {
          ds.guardMeta.set(parent, { children });
          break;
        }
      }
    };

    const parentCompOrGuard = ds.compMeta.get(parent) ?? ds.guardMeta.get(parent);
    // If comp(or guard)<-el, no action
    // If comp(or guard)<-comp, parent also guards val
    // If comp(or guard)<-guard, parent also guards val's children and val is no longer a guard
    // If el<-el, no action
    // If el<-comp, parent is now a guard of val
    // If el<-guard, parent is now a guard of val's children and val is no longer a guard

    const valueCompMeta = ds.compMeta.get(value);
    const valueGuardMeta = ds.guardMeta.get(value);
    // No action case:
    if (!valueCompMeta && !valueGuardMeta) {
      maybeAttach();
      console.groupEnd();
      return retAdd;
    }

    if (parentCompOrGuard) {
      if (valueCompMeta)
        parentCompOrGuard.children.add(value);
      else if (valueGuardMeta)
        valueGuardMeta.children.forEach(x => parentCompOrGuard.children.add(x));
    } else {
      const children = valueGuardMeta?.children ?? new Set([value]);
      if (!parent.parentElement || parent === document.body)
        ds.guardMeta.set(parent, { children });
      else
        // Being add()'d into a connected tree. Look for a comp/guard parent
        walkUpToPlaceChildren(children);
    }
    maybeAttach();
    // Delete _after_ attaching
    if (valueGuardMeta) ds.guardMeta.delete(value);
    console.groupEnd();
    return retAdd;
  };

const insertTracer = (insertCall: typeof api.insert): typeof api.insert =>
  (el, value, endMark, current, startNode) => {
    console.group(`api.insert(el:${type(el)}, value:${type(value)}, current:${type(current)}`);
    const retInsert = insertCall(el, value, endMark, current, startNode);
    console.log('Returning', retInsert);
    console.groupEnd();
    return retInsert;
  };

export { hTracer, addTracer, insertTracer };
