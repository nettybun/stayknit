import { decl, css, injectGlobal } from 'styletakeout.macro';

const color = {
  black:     decl`#000`,
  white:     decl`#fff`,
  gray100:   decl`#f7fafc`,
  gray200:   decl`#edf2f7`,
  gray300:   decl`#e2e8f0`,
  gray400:   decl`#cbd5e0`,
  gray500:   decl`#a0aec0`,
  gray600:   decl`#718096`,
  gray700:   decl`#4a5568`,
  gray800:   decl`#2d3748`,
  gray900:   decl`#1a202c`,
  red100:    decl`#fff5f5`,
  red200:    decl`#fed7d7`,
  red300:    decl`#feb2b2`,
  red400:    decl`#fc8181`,
  red500:    decl`#f56565`,
  red600:    decl`#e53e3e`,
  red700:    decl`#c53030`,
  red800:    decl`#9b2c2c`,
  red900:    decl`#742a2a`,
  orange100: decl`#fffaf0`,
  orange200: decl`#feebc8`,
  orange300: decl`#fbd38d`,
  orange400: decl`#f6ad55`,
  orange500: decl`#ed8936`,
  orange600: decl`#dd6b20`,
  orange700: decl`#c05621`,
  orange800: decl`#9c4221`,
  orange900: decl`#7b341e`,
  yellow100: decl`#fffff0`,
  yellow200: decl`#fefcbf`,
  yellow300: decl`#faf089`,
  yellow400: decl`#f6e05e`,
  yellow500: decl`#ecc94b`,
  yellow600: decl`#d69e2e`,
  yellow700: decl`#b7791f`,
  yellow800: decl`#975a16`,
  yellow900: decl`#744210`,
  green100:  decl`#f0fff4`,
  green200:  decl`#c6f6d5`,
  green300:  decl`#9ae6b4`,
  green400:  decl`#68d391`,
  green500:  decl`#48bb78`,
  green600:  decl`#38a169`,
  green700:  decl`#2f855a`,
  green800:  decl`#276749`,
  green900:  decl`#22543d`,
  teal100:   decl`#e6fffa`,
  teal200:   decl`#b2f5ea`,
  teal300:   decl`#81e6d9`,
  teal400:   decl`#4fd1c5`,
  teal500:   decl`#38b2ac`,
  teal600:   decl`#319795`,
  teal700:   decl`#2c7a7b`,
  teal800:   decl`#285e61`,
  teal900:   decl`#234e52`,
  blue100:   decl`#ebf8ff`,
  blue200:   decl`#bee3f8`,
  blue300:   decl`#90cdf4`,
  blue400:   decl`#63b3ed`,
  blue500:   decl`#4299e1`,
  blue600:   decl`#3182ce`,
  blue700:   decl`#2b6cb0`,
  blue800:   decl`#2c5282`,
  blue900:   decl`#2a4365`,
  indigo100: decl`#ebf4ff`,
  indigo200: decl`#c3dafe`,
  indigo300: decl`#a3bffa`,
  indigo400: decl`#7f9cf5`,
  indigo500: decl`#667eea`,
  indigo600: decl`#5a67d8`,
  indigo700: decl`#4c51bf`,
  indigo800: decl`#434190`,
  indigo900: decl`#3c366b`,
  purple100: decl`#faf5ff`,
  purple200: decl`#e9d8fd`,
  purple300: decl`#d6bcfa`,
  purple400: decl`#b794f4`,
  purple500: decl`#9f7aea`,
  purple600: decl`#805ad5`,
  purple700: decl`#6b46c1`,
  purple800: decl`#553c9a`,
  purple900: decl`#44337a`,
  pink100:   decl`#fff5f7`,
  pink200:   decl`#fed7e2`,
  pink300:   decl`#fbb6ce`,
  pink400:   decl`#f687b3`,
  pink500:   decl`#ed64a6`,
  pink600:   decl`#d53f8c`,
  pink700:   decl`#b83280`,
  pink800:   decl`#97266d`,
  pink900:   decl`#702459`,
};

const size = {
  0:  '0',
  1:  '0.25re',
  2:  '0.5rem',
  3:  '0.75re',
  4:  '1rem',
  5:  '1.25re',
  6:  '1.5rem',
  8:  '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
};

const pageBackground = decl`#faf5ff`;
const bodyBackground = decl`#eee`;

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background-color: ${bodyBackground};
    font-family: 'system-ui', sans-serif;
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
  color: ${color.blue400};
  &:hover {
    color: ${color.blue500};
    text-decoration: underline;
  }
`;

const DashBorder = css`
  border: 2px dashed ${color.blue500};
`;

const styles = {
  Page,
  Link,
  DashBorder,
};

export { styles };
