import { h } from 'haptic';
import { css, sizes, colours, snippets } from 'styletakeout.macro';

import { addMessage } from '../state.js';

const NavBar = ({ items }: { items: string[] }): h.JSX.Element =>
  <div class={barStyle}>
    {items.map(text =>
      <a class={linkStyle} onClick={() => addMessage(text)}>
        {text}
      </a>
    )}
  </div>;

const barStyle = css`
  display: flex;
  border-radius: ${sizes._01};
  border: 1px solid ${colours.purple._200};
  border-bottom: none;
  margin-bottom: ${sizes._02};
  ${snippets.text.sm}
`;

const linkStyle = css`
  flex: 1 1 0%;
  text-align: center;
  padding: ${sizes._02} ${sizes._04};
  border-bottom: 2px solid;
  background: ${colours.white};
  &:hover {
    background: ${colours.gray._100};
    border-color: ${colours.purple._500};
  }
`;

export { NavBar };
