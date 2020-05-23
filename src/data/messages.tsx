import { observable, computed, subscribe, sample } from 'sinuous/observable';

// This can't be a document fragment, it needs to be mountable
const messages = observable([] as string[]);

const addMessage = (text: string) => {
  const list = messages();
  list.push(text);
  messages(list);
};

const count = observable(0);
const squared = computed(() => Math.pow(count(), 2));

subscribe(() => {
  const x = squared();
  console.log(x);
  // #addMessage(String(x)); causes an infinite loop
  const list = sample(messages);
  list.push(String(x));

  messages(list);
});

export { messages, addMessage };
// Global
Object.assign(window, { messages, addMessage, count });
