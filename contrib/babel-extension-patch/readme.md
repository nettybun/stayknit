# Import extension patch

Tack on `.js` to the end of all your imports. **_No longer in use at all_**

This was written because early versions of Snowpack couldn't handle Typescript
or JSX/TSX - source files had to be JS. Furthermore, imports _weren't_ converted
from `./file.ts` to `./file.js` so the browser wouldn't be able to resolve the
module at runtime. It was a mess.

Snowpack has since updated to support TS and I've seen changed to use an ESLint
plugin to enforce the use of `.js` extensions on all files. Typescript supports
JS extensions on TS files, and VSCode resolves them too (ctrl+click etc).

It's now easier to not use this plugin.
