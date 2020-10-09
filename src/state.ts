import { signal, computed, subscribe, sample } from 'haptic/s';
import type { Signal } from 'haptic/s';

const route: Signal<'A' | 'B' | 'C'> = signal('A');

// This can't be a document fragment, it needs to be mountable
const messages = signal([] as string[]);

const addMessage = (text: string): void => {
  const list = messages();
  console.log(`messages().push("${text}")`);
  list.push(text);
  messages(list);
};

const count = computed(() => messages().length);
const svgSize = computed(() => `${30 + messages().length * 10}px`);

export { route, messages, addMessage, count, svgSize };
