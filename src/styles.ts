import { css, injectGlobal } from 'styletakeout.macro';

const pageBackground = '#faf5ff';
const bodyBackground = '#eee';

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background-color: ${bodyBackground};
  }
`;

// TODO: I've decided these should really just be in their own CSS file
const text = {
  xs:    css`font-size: .75rem;`,
  sm:    css`font-size: .875rem;`,
  base:  css`font-size: 1rem;`,
  lg:    css`font-size: 1.125rem;`,
  xl:    css`font-size: 1.25rem;`,
  xl2:   css`font-size: 1.5rem;`,
  xl3:   css`font-size: 1.875rem;`,
  xl4:   css`font-size: 2.25rem;`,
};

const margin = {
  _0:    css`margin: 0;`,
  _1:    css`margin: 0.25rem;`,
  _2:    css`margin: 0.5rem;`,
  _3:    css`margin: 0.75rem;`,
  _4:    css`margin: 1rem;`,
  _5:    css`margin: 1.25rem;`,
  _6:    css`margin: 1.5rem;`,
  _8:    css`margin: 2rem;`,
  _10:   css`margin: 2.5rem;`,
  _12:   css`margin: 3rem;`,
  _16:   css`margin: 4rem;`,
  _20:   css`margin: 5rem;`,
  _auto: css`margin: auto 0`,
};

const padding = {
  _0:    css`padding: 0;`,
  _1:    css`padding: 0.25rem;`,
  _2:    css`padding: 0.5rem;`,
  _3:    css`padding: 0.75rem;`,
  _4:    css`padding: 1rem;`,
  _5:    css`padding: 1.25rem;`,
  _6:    css`padding: 1.5rem;`,
  _8:    css`padding: 2rem;`,
  _10:   css`padding: 2.5rem;`,
  _12:   css`padding: 3rem;`,
  _16:   css`padding: 4rem;`,
  _20:   css`padding: 5rem;`,
};

const Page = css`
  background-color: ${pageBackground};
  margin-bottom: 5px;
  padding: 2rem;
  max-width: 800px;

  > * {
    margin-bottom: 0.5rem;
  }
`;

const Link = css`
  color: #63b3ed;
  &:hover {
    color: #45c5ff;
    text-decoration: underline;
  }
`;

const styles = {
  t: text,
  m: margin,
  p: padding,

  Page,
  Link,
};

export { styles };
