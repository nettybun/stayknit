import { observable, computed, subscribe, sample } from 'sinuous/observable';
import type { Observable } from 'sinuous/observable';

const route: Observable<'A' | 'B' | 'C'> = observable('A');

// This can't be a document fragment, it needs to be mountable
const messages = observable([] as string[]);

const addMessage = (text: string): void => {
  const list = messages();
  console.log(`messages().push("${text}")`);
  list.push(text);
  messages(list);
};

const count = computed(() => messages().length);
const svgSize = computed(() => `${30 + messages().length * 10}px`);

export { route, messages, addMessage, count, svgSize };
