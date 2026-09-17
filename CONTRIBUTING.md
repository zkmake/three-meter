# Contributing

Bun is the package manager and script runner.

```sh
bun install
bun run typecheck   # tsc
bun run test        # vitest
bun run build       # tsdown to dist/, then publint and arethetypeswrong
bun run lint        # oxlint
bun run format      # oxfmt
```

`examples/vanilla` and `examples/r3f` are Vite apps with their own `bun install`. The root is the
published package, not a workspace root, because changesets needs to see it as the package. Run
`bun run dev` inside an example. Both alias `@zkmake/three-meter` to `../../src` through Vite
`resolve.alias` and tsconfig `paths`, so editing the library hot-reloads in the example with no
build step.

## Layout

- `src/core` holds `PerformanceMonitor`, the GPU timer and the ring buffer. No DOM, no deps. The
  renderer contract is the structural `PerfRenderer` type, and `tests/renderer-types.ts` pins it
  against three's real `WebGLRenderer` and `WebGPURenderer`.
- `src/ui` holds the DOM card, the dock, the settings and the injected stylesheet. No runtime deps.
- `src/react` holds the React Three Fiber adapter. Peer deps only.

`three` is a devDependency for the type pin and must stay out of `dependencies`.

## Releasing

Every user-facing change carries a changeset, made with `bun run changeset`. The release workflow
opens a "Version Packages" PR from pending changesets. Merging it publishes with provenance through
npm trusted publishing. Commit messages follow Conventional Commits.
