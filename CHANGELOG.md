# @zkmake/three-meter

## 0.1.1

### Patch Changes

- [`bb61f94`](https://github.com/zkmake/three-meter/commit/bb61f9455f3a219e188273620d8a9ca11904710f) Thanks [@zkmake](https://github.com/zkmake)! - Fix the published `exports`. 0.1.0 shipped a `development` condition pointing at `./src`, which is
  not in the tarball, so Vite dev servers and TypeScript with a `development` custom condition
  resolved to a missing file. Every condition now points at `dist/`.

## 0.1.0

### Minor Changes

- [`ec86646`](https://github.com/zkmake/three-meter/commit/ec86646b257462f0fd5299c018091a094c91a02a) Thanks [@zkmake](https://github.com/zkmake)! - First release. `PerformanceMonitor` (FPS, CPU ms, GPU ms on WebGL2 or WebGPU, draw calls, passes,
  triangles, resource counts), `mountPerfHud` (dockable, persisted DOM card), and the React Three
  Fiber pair `PerfSampler` / `PerfHud`.
