# Stayknit

This repo was originally to build a homepage with [Sinuous][1] for Stayknit, a
cloud I host for my partners. However, I ended up more focused on Sinuous
itself, and sidetracked the project to help develop better Typescript and JSX
support, a starter kit of Sinuous with Typescript and Snowpack, and community
packages such as [`sinuous-trace`][2] and [`sinuous-lifecycle`][3].

This project is written and published as a set of native ES modules. There is no
bundler or transpilation (beyond removing Typescript annotations). [Snowpack][4]
is used to provide a `web_modules` directory. This means you'll need a modern
browser that supports ESM out of the box. I was very tired of bundlers - if you
are too, let this spark hope a better future in JS modules.

I've composed _parts_ of Sinuous in _src/base.ts_ to provide a local framework
used throughout the rest of the project. This is mostly because Sinuous is
written to target JS-only developers who will use [HTM][5] to convert HTML-in-JS
tag templates to `h()` calls at runtime. JSX transpilation does this at compile
time, so there's no need to import HTM. This project doesn't use tree-shaking so
the best option is to not carry the code at all.

Some concepts hadn't existed in the Sinuous ecosystem, so I'm currently
developing packages for them. The two mentioned above in the introduction were
moved to [their own repository][6] and are now published.

- The trace package follows Sinuous' execution and maintains a tree of all
  component relationships.
- The lifecycle package uses this tree to provide `onAttach`/`onDetach` hooks
  which run when components are added to and removed from the DOM.

Each package has an optional log plugin provided to write all operations to the
browser console. This repository's GitLab page showcases this. Feedback is very
welcomed for either package.

https://nthm.gitlab.io/stayknit/

Next I'll continue working on server-side-rendering and hydration for Sinuous. I
have SSR working ([CI demo][7]) and a mechanism using `sinuous-trace` to collect
observables and event handlers to be re-hydrated at run time. It's a work in
progress.

The last project on the go is in _contrib/babel/_ to factor out CSS-in-JS at
compile-time. Only research has been done. It'll use the preprocessor from
styled-components to leverage VSCode syntax highlighting and type checking to
vibe well with the Typescript-nature of this project.

I think Sinuous is a beautiful project and has a bright future. JS frameworks
often become over-engineered and heavy, so it's nice to see an approachable
lightweight project that anyone use without drowning in tooling.

[1]: https://sinuous.dev
[2]: https://gitlab.com/nthm/sinuous-packages/-/tree/work/sinuous-trace
[3]: https://gitlab.com/nthm/sinuous-packages/-/tree/work/sinuous-lifecycle
[4]: https://snowpack.dev
[5]: https://github.com/developit/htm/
[6]: https://gitlab.com/nthm/sinuous-packages/
[7]: https://gitlab.com/nthm/stayknit/-/jobs/615115580
