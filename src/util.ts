/** Running in Node during a server-side render */
const inSSR = typeof window === 'undefined';

type Fn = (...args: unknown[]) => void;
function debounce(fn: Fn, wait: number, immediate?: boolean): Fn {
  let timeout: number | null;
  return (...args: unknown[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) fn(...args);
    };
    const callNow = immediate && !timeout;
    timeout && clearTimeout(timeout);
    // TS will default to the return type `NodeJS.Timeout` which isn't `number`
    timeout = (setTimeout as typeof window.setTimeout)(later, wait);
    if (callNow) fn(...args);
  };
}

const stripIndent = (str: string): string => {
  str = str.replace(/^\n/, '').trimEnd();
  const match = str.match(/^[ \t]*(?=\S)/gm);
  if (!match) return str;

  const indent = Math.min(...match.map(x => x.length));
  const re = new RegExp(`^[ \\t]{${indent}}`, 'gm');
  return indent > 0 ? str.replace(re, '') : str;
};

export { inSSR, debounce, stripIndent };
