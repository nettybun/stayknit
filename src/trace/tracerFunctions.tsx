import type { _h, api } from 'sinuous/h';
import type { El, ComponentName } from './index';

import { ds, callAttachForTree, DATASET_TAG } from './index';
import { type } from './utils';

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
    const elGuard = ds.guardianNodes.get(el);
    const children = elGuard?.children ?? new Set<El>();
    if (elGuard) {
      console.log('Upgrading guard to component');
      ds.guardianNodes.delete(el);
    }
    ds.instanceMetadata.set(el, { name, children, lifecycles });
    const instances = ds.componentNames.get(name) ?? new WeakSet<El>();
    ds.componentNames.set(name, instances.add(el));
    // TODO: Support DocumentFragment
    if (!(el instanceof DocumentFragment)) {
      el.dataset[DATASET_TAG] = name;
    }
    console.log(`${name}: Done. Installed lifecycles: ${Object.keys(lifecycles).length}`);
    console.groupEnd();
    return el;
  };

const addTracer = (addCall: typeof api.add): typeof api.add =>
  (parent: El, value: El, endMark) => {
    const log = `api.add(parent:${type(parent)}, value:${type(value)})`;
    console.group(log);

    // TODO: Learned that api.add is not purely a sub-function of api.h. It
    // calls api.h if it's given an array and then converts it to a fragment
    // internally such that we never see it. Re-entrant functions are super hard
    // to reason about... It's not worth it. I'll either re-implement everything
    // as done in api.rm or I'll fork Sinuous

    const valueWasNotPreviouslyConnected = !value.isConnected;
    const retAdd = addCall(parent, value, endMark);

    if (!(value instanceof Element)) {
      console.log(`Not Element: ${type(value)}. Returning`, retAdd);
      console.groupEnd();
      return retAdd;
    }

    const retAddMaybeAttach = () => {
      const e = (x: boolean) => x ? '✅' : '❌';
      console.log(`Attached? Parent ${e(parent.isConnected)}. Value ${e(!valueWasNotPreviouslyConnected)}`);
      if (parent.isConnected && valueWasNotPreviouslyConnected) {
        console.log('%conAttach', 'background: lightgreen', 'for value');
        callAttachForTree(value);
      }
      console.groupEnd();
      return retAdd;
    };

    // Here's where guardians are actually used...
    const isComp = (el: Element) => ds.instanceMetadata.has(el);
    // If comp(or guard)<-el, no action
    // If comp(or guard)<-comp, parent also guards val
    // If comp(or guard)<-guard, parent also guards val's children and val is no longer a guard
    // If el<-el, no action
    // If el<-comp, parent is now a guard of val
    // If el<-guard, parent is now a guard of val's children and val is no longer a guard
    const parentCompOrGuard
      = ds.instanceMetadata.get(parent) ?? ds.guardianNodes.get(parent);
    let valueGuard;
    if (parentCompOrGuard) {
      if (isComp(value)) parentCompOrGuard.children.add(value);
      // eslint-disable-next-line no-cond-assign
      else if (valueGuard = ds.guardianNodes.get(value)) {
        valueGuard.children.forEach(x => parentCompOrGuard.children.add(x));
        ds.guardianNodes.delete(value);
      }
      return retAddMaybeAttach();
    }
    // Else parent is non-component
    valueGuard = ds.guardianNodes.get(value);
    if (isComp(value) || valueGuard) {
      const children = valueGuard?.children ?? new Set([value]);
      // There's a chance that a comp/guard is being api.add()'d into an
      // existing tree that is live and actually does have a comp/guard parent
      if (!parent.parentElement || parent === document.body) {
        ds.guardianNodes.set(parent, { children });
      } else {
        let cursor: El | null = parent;
        // eslint-disable-next-line no-cond-assign
        while (cursor = cursor.parentElement) {
          console.log('Trying', type(cursor));
          const container
            = ds.instanceMetadata.get(cursor)
              ?? ds.guardianNodes.get(cursor);
          if (container) {
            console.log(`Found ${type(cursor)}`);
            children.forEach(x => container.children.add(x));
            break;
          }
        }
        if (!cursor) {
          throw 'Was never able to find a component or guard walking up tree';
        }
      }
    }
    if (valueGuard) ds.guardianNodes.delete(value);
    return retAddMaybeAttach();
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
