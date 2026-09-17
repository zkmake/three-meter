# @zkmake/three-meter

Frame metrics for a three.js renderer — FPS, CPU ms, GPU ms, draw calls, render passes, triangles,
geometries / textures / programs — with a small dockable HUD. Zero dependencies. Works with
`WebGLRenderer` and `WebGPURenderer`, with or without React.

> Pre-release. Lives in the `zkMake/edtech-apps` monorepo for now; see `docs/plans/perf-hud-extraction.md`.

## Entry points

| Import                      | What it is                                                                 |
| --------------------------- | -------------------------------------------------------------------------- |
| `@zkmake/three-meter`       | `PerformanceMonitor` — `begin()` / `end()` bracket a frame. No DOM.        |
| `@zkmake/three-meter/ui`    | `mountPerfHud(monitor, options)` — the dockable card. Vanilla DOM.         |
| `@zkmake/three-meter/react` | `PerfSampler` (inside `<Canvas>`) + `PerfHud` (outside). Peers: react, r3f |

## Vanilla three

```ts
import { PerformanceMonitor, wrapAnimationLoop } from "@zkmake/three-meter";
import { mountPerfHud } from "@zkmake/three-meter/ui";

const monitor = new PerformanceMonitor({ renderer });
const hud = mountPerfHud(monitor); // appends to document.body, docks left-centre

renderer.setAnimationLoop(
  wrapAnimationLoop(monitor, () => {
    update();
    renderer.render(scene, camera);
  }),
);

// later
hud.dispose();
monitor.dispose();
```

Manual loops call `monitor.begin()` before the frame's work and `monitor.end()` after the render.

## React Three Fiber

```tsx
import { Canvas } from "@react-three/fiber";
import { PerfHud, PerfSampler } from "@zkmake/three-meter/react";

<>
  <Canvas>
    <PerfSampler />
    {/* scene */}
  </Canvas>
  <PerfHud />
</>;
```

`PerfHud` must sit outside `<Canvas>` — Fiber treats HTML under it as three objects. The two find each
other through a small shared store (a React context can't cross the Canvas root); pass the same
`store` prop to both to run two canvases on one page.

## Options

`mountPerfHud` / `PerfHud`:

| Option             | Default            | Meaning                                                                              |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------ |
| `mode`             | `"compact"`        | `compact` is the card; `full` is the checkbox list that configures it                |
| `defaultPlacement` | `{ edge: "left" }` | First-visit dock: `edge` + `align` (`start` / `center` / `end`); a drag overrides it |
| `storageKey`       | `three-meter`      | localStorage key for the selection and the dock; `null` = no persistence             |
| `parent`           | `document.body`    | Where the host element is appended                                                   |
| `injectStyles`     | `true`             | Append the stylesheet once per document                                              |
| `refreshHz`        | `10`               | Repaint rate                                                                         |

`PerformanceMonitor` / `PerfSampler`: `trackGPU` (default true), `gpuQueryPoolSize` (5), `historySize` (120).

## GPU timing

- **WebGL2**: `EXT_disjoint_timer_query_webgl2` — Chrome and Edge. Safari and Firefox don't expose it;
  the GPU row shows `—` and `sample.gpu.available` is `false`.
- **WebGPU**: construct the renderer with `trackTimestamp: true`; timings resolve a frame or two late.

## Examples

`examples/vanilla` (plain three, `?webgpu` for `WebGPURenderer`, `?count=` to scale) and
`examples/r3f`. Each is a Vite app: `bun run dev--off` inside it.

## Shipping it

Styles inject at runtime by default; to link them instead, pass `injectStyles: false` and import
`@zkmake/three-meter/styles.css`.

The package never looks at `NODE_ENV` or `import.meta.env`. Whether the HUD exists in production is
your call — gate the import (a `?debug=` query, a build flag, a dynamic `import()`) in the app.

## Contract

While a monitor is attached, `renderer.info.autoReset` is off and `info` is reset in `begin()`. One
monitor per renderer; a second throws. `dispose()` restores everything. Theme with the `--perf-*`
custom properties on `.perf-monitor`.

## License

MIT
