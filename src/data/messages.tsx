import { observable, computed, subscribe, sample } from 'sinuous/observable';

// This can't be a document fragment, it needs to be mountable
const messages = observable([] as string[]);

const addMessage = (text: string): void => {
  const list = messages();
  console.log(`messages().push("${text}")`);
  list.push(text);
  messages(list);
};

export { messages, addMessage };
// Global
Object.assign(window, { messages, addMessage });
