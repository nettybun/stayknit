import { decl, colours, sizes, css, injectGlobal } from 'styletakeout.macro';

// Most of this is lifted from Tailwind
injectGlobal`
  * {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #e2e8f0;
  }
  html {
    /* It's actually important to have the emoji fonts too */
    font-family: system-ui,Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
    line-height: 1.5;
  }
  body {
    background-color: ${decl.bodyBackground};
  }
  /* From Tailwind's preflight.css */
  body, blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre {
    margin: 0;
  }
  img, svg, video, canvas, audio, iframe, embed, object {
    display: block;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  code, kbd, pre {
    font-family: Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
    font-size: 0.9em;
  }
  pre {
    font-size: 0.75em;
  }
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
    border: 2px solid ${colours.gray._400};
    overflow-x: auto;
    padding: ${sizes._03};
  `,
};

export { styles };
