// Adapted from... a few projects actually:

// Stylis is the preprocessor. It's used in Emotion and Styled-Components to
// support nesting selectors like &:hover {}

// Pre-Style is really close. It's a Babel plugin that pulls out CSS (!).
// Unfortunately it also atomizes CSS one rule per class? Also it's SASS/CSSNano

// CSZ uses Stylis (v1) but it's a runtime library in browser

// CSSTag is Babel but PostCSS. Encourages writing all classes to an object but
// it's impossible to work with TypeScript that way

// TODO: Actually just use @emotion/stylis. It's v3 instead of v4, but it works
// well and is the most supported and has types and is _simple_.

// import { compile } from 'stylis';
