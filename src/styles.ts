import { decl, css, injectGlobal } from 'styletakeout.macro';

const pageBackground = decl`#faf5ff`;
const bodyBackground = decl`#eee`;

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background-color: ${bodyBackground};
  }
`;

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
  Page,
  Link,
};

export { styles };
