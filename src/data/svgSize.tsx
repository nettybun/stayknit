import { computed } from 'sinuous/observable';
import { messages } from './messages.js';

export const svgSize = computed(() => `${30 + messages().length * 10}px`);
