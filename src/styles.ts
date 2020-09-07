import { decl, colours, sizes, css, injectGlobal } from 'styletakeout.macro';

declare module 'styletakeout.macro' {
  const decl: {
    // Remember that TS definitions are entirely for linting/intellisense
    // Values aren't real. Pick anything that helps you remember
    pageBackground: 'c.purple.100'
    bodyBackground: '#eee'
    colour: typeof colours
    size: typeof sizes
  };
  const colours: ScaledColors & {
    black: string,
    white: string,
  };
  const sizes: {
    // Without the leading 0 autocomplete will order them wrong
    // Prefix with 's' for same reason as 'c'
    _00: '0'
    _01: '0.25rem'
    _02: '0.5rem'
    _03: '0.75rem'
    _04: '1rem'
    _05: '1.25rem'
    _06: '1.5rem'
    _08: '2rem'
    _10: '2.5rem'
    _12: '3rem'
    _16: '4rem'
    _20: '5rem'
    _24: '6rem'
    _32: '8rem'
    _40: '10rem'
    _48: '12rem'
    _56: '14rem'
    _64: '16rem'
  };
  // It's not important to be able to see the value so use string to simplify
  // Numbers can't be object property names without ['100'] so prefix with '_'
  type Scale = {
    [level in
      | '_100'
      | '_200'
      | '_300'
      | '_400'
      | '_500'
      | '_600'
      | '_700'
      | '_800'
      | '_900']: string
  }
  type ScaledColors = {
    [color in
      | 'gray'
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'teal'
      | 'blue'
      | 'indigo'
      | 'purple'
      | 'pink']: Scale
  }
}

injectGlobal`
  * {
    box-sizing: border-box;
  }
  html {
    font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
    line-height: 1.5;
  }
  body {
    margin: 0;
    background-color: ${decl.bodyBackground};
  }
  p {
    margin: 0;
  }
  code, kbd, pre {
    font-family: Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
    font-size: 0.9em;
  }
  pre {
    font-size: 0.75em;
  }
  /* Text and sizing */
  .text-xs   { font-size: 0.75rem ; }
  .text-sm   { font-size: 0.875rem; }
  .text-base { font-size: 1rem    ; }
  .text-lg   { font-size: 1.125rem; }
  .text-xl   { font-size: 1.25rem ; }
  .text-2xl  { font-size: 1.5rem  ; }
  .text-3xl  { font-size: 1.875rem; }
  .text-4xl  { font-size: 2.25rem ; }
  .text-5xl  { font-size: 3rem    ; }
  .text-6xl  { font-size: 4rem    ; }

  .space > * {
    margin-bottom: ${sizes._04};
  }
  .space > :last-child {
    margin-bottom: 0;
  }
`;

// I recommend inlining styles to one object without pointing to variables.
// Then Ctrl+Hover will show you the full definition as a hint in VSCode.
const styles = {
  Page: css`
    background-color: ${decl.pageBackground};
    margin-bottom: 5px;
    padding: ${sizes._08};
    max-width: 800px;
  `,
  ButtonBlue: css`
    color: ${colours.white};
    padding: ${sizes._02} ${sizes._04};
    background-color: ${colours.blue._400};
    border: 2px solid ${colours.blue._200};
    border-radius: 5px;
    &:hover {
      background-color: ${colours.blue._500};
    }
  `,
  DashBorderBlue: css`
    border: 2px dashed ${colours.blue._500};
    margin: inherit -10px;
    padding: 10px;
  `,
  CodeBlock: css`
    background: ${colours.gray._200};
    overflow-x: auto;
    padding: ${sizes._05};
  `,
};

export { styles };
