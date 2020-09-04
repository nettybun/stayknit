import { h } from '../sinuous.js';
import { addMessage } from '../state.js';
import { css, sizes, colours } from 'styletakeout.macro';

const barStyle = css`
  display: flex;
  border-radius: ${sizes._01};
  border: 1px solid ${colours.purple._200};
  border-bottom: none;
  margin-bottom: ${sizes._02};
`;

const NavBar = ({ items }: { items: string[] }): h.JSX.Element =>
  <div class={`${barStyle} text-sm`}>
    {items.map(text =>
      <a
        class={
          css`
            flex: 1 1 0%;
            text-align: center;
            padding: ${sizes._02} ${sizes._04};
            border-bottom: 2px solid #e2e8f0;
            background: ${colours.white};
            &:hover {
              background: ${colours.gray._100};
              border-color: ${colours.purple._500};
            }
          `}
        onClick={() => addMessage(text)}
      >
        {text}
      </a>
    )}
  </div>;

export { NavBar };
