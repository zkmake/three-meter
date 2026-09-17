# Contributing

Bun is the package manager and script runner.

```sh
bun install
bun run typecheck   # tsc
bun run test        # vitest
bun run build       # tsdown → dist/, then publint + arethetypeswrong
bun run lint        # oxlint
bun run format      # oxfmt
```

`examples/vanilla` and `examples/r3f` are Vite apps with their own `bun install` (the root is the
published package, not a workspace root — changesets needs it that way). `bun run dev` inside one.
They alias
`@zkmake/three-meter` to `../../src` (Vite `resolve.alias` + tsconfig `paths`), so editing the
library hot-reloads in the example with no build step.

## Layout

- `src/core` — `PerformanceMonitor`, GPU timer, ring buffer. No DOM, no deps. The renderer
  contract is the structural `PerfRenderer` type; `tests/renderer-types.ts` pins it against
  three's real `WebGLRenderer` and `WebGPURenderer`.
- `src/ui` — the DOM card, dock, settings, injected stylesheet. Runtime deps: none.
- `src/react` — React Three Fiber adapter. Peer deps only.

`three` is a devDependency for the type pin and must stay out of `dependencies`.

## Releasing

Every user-facing change carries a changeset (`bun run changeset`). The release workflow opens a
"Version Packages" PR from pending changesets; merging it publishes with provenance via npm trusted
publishing. Commit messages follow Conventional Commits.
