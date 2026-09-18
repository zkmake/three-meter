# @zkmake/three-meter

## 0.3.0

### Minor Changes

- [#5](https://github.com/zkmake/three-meter/pull/5) [`360e70d`](https://github.com/zkmake/three-meter/commit/360e70d693a889e5bde8f0099f8cb17822a43f4a) Thanks [@zkmake](https://github.com/zkmake)! - Let the person using the HUD pick its theme. The full view gains a light / system / dark row; the
  pick persists with the other settings under `storageKey` (`HudSettings.theme`, `setTheme`) and sits
  on top of the consumer's `theme` option, which still applies whenever nothing has been picked.
  `HudTheme` exposes the layers as `mode` (consumer), `override` (panel pick) and `effective`, with
  `setOverride` to drive the top layer; `resolved` follows `effective`.

## 0.2.0

### Minor Changes

- [#3](https://github.com/zkmake/three-meter/pull/3) [`b451117`](https://github.com/zkmake/three-meter/commit/b451117464bb6d613a36ceb883f469263841b2db) Thanks [@zkmake](https://github.com/zkmake)! - Add a light palette and a `theme` option to `mountPerfHud` and `PerfHud`: `dark`, `light`, or
  `system` (the default), which follows `prefers-color-scheme` live. The handle gains `getTheme`,
  `setTheme` and a `theme` controller whose `resolved` value and `subscribe` let a host page follow
  the HUD. In React the `theme` prop applies without remounting. Every colour in the stylesheet now
  comes from a `--perf-*` custom property, and the resolved theme lands on `data-theme` of `.perf-hud`
  and `.perf-monitor`.

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
