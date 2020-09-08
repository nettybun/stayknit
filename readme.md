# Stayknit

This repo is for the testing and development of [Sinuous][1] and other packages
listed below. It's a place to try out a modern healthy web stack.

It's Sinuous(+Lifecycles), ESM-only, TS, JSX, CSS-in-JS, and SSR.

Originally this repo was created to build a homepage for Stayknit, a cloud I
host for my partners. It's been sidetracked to say the least.

https://nthm.gitlab.io/stayknit/

## Packages

Sinuous:
  - Component relationships: [sinuous-trace][2]
  - Component lifecycles: [sinuous-lifecycle][3]

Web:
  - CSS-in-JS at compile time: [styletakeout.macro][4]
  - DOM in Node for SSR: [softdom.js][5]

## Structure

This is ESM-only. No bundler - Babel removes all Typescript annotations.
Packages are handled by [Snowpack][6]. I was very tired of bundlers - if you are
too, let this spark hope a better future in JS modules.

I've composed _parts_ of Sinuous in _src/sinuous.ts_ to provide a local
framework used throughout the rest of the project. Mostly because by default
Sinuous pulls in [HTM][7] but JSX already does this work at compile time.
There's no tree-shaking so the best option is to not include HTM at all.

## Future

- Publish a TS+JSX Sinuous starter kit
- Publish a ESM(Snowpack)+TS+JSX Sinuous starter kit
- Work on SSR hydration ([CI demo][8])
  - Support event handlers
  - Support observables

I think Sinuous is a beautiful project and has a bright future. JS frameworks
often become over-engineered and heavy, so it's nice to see an approachable
lightweight project that anyone use without drowning in tooling.

[1]: https://sinuous.dev
[2]: https://gitlab.com/nthm/sinuous-packages/-/tree/work/sinuous-trace
[3]: https://gitlab.com/nthm/sinuous-packages/-/tree/work/sinuous-lifecycle
[4]: https://gitlab.com/nthm/styletakeout
[5]: https://gitlab.com/nthm/softdom
[6]: https://snowpack.dev
[7]: https://github.com/developit/htm/
[8]: https://gitlab.com/nthm/stayknit/-/jobs/615115580
