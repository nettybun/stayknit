import { h } from '../sinuous.js';
import { decl, css } from 'styletakeout.macro';

const Link = ({ to, name }: { to: string, name?: string }): h.JSX.Element =>
  <a
    class={
      css`
        color: ${decl.color.blue.c400};
        &:hover {
          color: ${decl.color.blue.c500};
          text-decoration: underline;
        }
      `}
    href={to}
  >
    {name ?? to}
  </a>;

export { Link };
