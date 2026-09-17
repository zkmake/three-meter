---
"@zkmake/three-meter": patch
---

Fix the published `exports`. 0.1.0 shipped a `development` condition pointing at `./src`, which is
not in the tarball, so Vite dev servers and TypeScript with a `development` custom condition
resolved to a missing file. Every condition now points at `dist/`.
