# @zkmake/three-meter

Frame metrics for a three.js renderer: FPS, CPU ms, GPU ms, draw calls, render passes, triangles,
geometries, textures and programs, with a small dockable HUD. Zero dependencies. Works with
`WebGLRenderer` and `WebGPURenderer`, with or without React.

```sh
bun add -d @zkmake/three-meter   # or npm i -D / pnpm add -D
```

Live demo: [three-meter.pages.dev](https://three-meter.pages.dev/), with a vanilla three and a
React Three Fiber take on the same scene. Add `?webgpu` for the WebGPU renderer and `?count=5000` to
load the scene up.

<p align="center">
  <img
    src="https://raw.githubusercontent.com/zkmake/three-meter/main/docs/hud-full.png"
    width="320"
    alt="The HUD in full mode, dark theme: a theme row (light, system, dark), a dim-on-leave toggle, FPS, CPU and GPU sparklines with live values, and a checkbox list of counters (FPS, calls, CPU, GPU, triangles, lines, points, render passes, geometries, textures, shaders) choosing what the compact card shows, then a footer with the three-meter version, the three revision, a WebGL2 backend badge and the GPU name. Two discs beside it: a drag grip and the compact/full toggle."
  />
</p>

The sampler and the card are separate components, so toggling the HUD never remounts your canvas.
GPU time is measured on WebGPU as well as WebGL. The counters are draw calls, render passes and
resource counts, which is what you watch when a scene is instanced. The card docks to a screen edge,
remembers where you put it, and hides its controls until the pointer comes near.

## Entry points

| Import                      | What it is                                                                   |
| --------------------------- | ---------------------------------------------------------------------------- |
| `@zkmake/three-meter`       | `PerformanceMonitor`. `begin()` and `end()` bracket a frame. No DOM.         |
| `@zkmake/three-meter/ui`    | `mountPerfHud(monitor, options)`, the dockable card. Vanilla DOM.            |
| `@zkmake/three-meter/react` | `PerfSampler` inside `<Canvas>`, `PerfHud` outside it. Peers: react and r3f. |

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

If you run your own loop, call `monitor.begin()` before the frame's work and `monitor.end()` after
the render.

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

`PerfHud` must sit outside `<Canvas>`, because Fiber treats HTML under it as three objects. The two
components find each other through a small shared store. A React context can't do this, since the
Canvas is its own React root. To run two canvases on one page, pass the same `store` prop to both.

## Options

`mountPerfHud` and `PerfHud` take:

| Option             | Default            | Meaning                                                                                       |
| ------------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| `mode`             | `"compact"`        | `compact` is the card. `full` is the checkbox list that configures it.                        |
| `theme`            | `"system"`         | `dark`, `light`, or `system` to follow `prefers-color-scheme` live. A pick in the panel wins. |
| `defaultPlacement` | `{ edge: "left" }` | First-visit dock, as `edge` plus `align` of `start`, `center` or `end`. A drag overrides it.  |
| `storageKey`       | `three-meter`      | localStorage key for the selection and the dock. `null` disables persistence.                 |
| `parent`           | `document.body`    | Where the host element is appended.                                                           |
| `injectStyles`     | `true`             | Append the stylesheet once per document.                                                      |
| `refreshHz`        | `10`               | Repaint rate.                                                                                 |

`PerformanceMonitor` and `PerfSampler` take `trackGPU` (default true), `gpuQueryPoolSize` (default 5),
`historySize` (default 120) and `frameStatsSize` (default 1000).

## Theme

The HUD ships a dark and a light palette. Two layers decide which shows:

1. **The panel's own pick.** The full view has a light / system / dark row. A pick there is kept
   with the other settings under `storageKey` and wins while set.
2. **Your `theme` option.** `dark`, `light`, or `system` (the default), which follows the OS and
   switches when it does. Applies whenever the person using the HUD hasn't picked anything.

Change your layer later from the handle, or from the `PerfHud` prop in React, which applies without
remounting:

```ts
const hud = mountPerfHud(monitor, { theme: "system" });
hud.setTheme("light"); // your layer: "dark" | "light" | "system"
hud.getTheme(); // your layer, as asked for
hud.settings.theme; // the panel's pick, or null
hud.settings.setTheme(null); // clear the pick so your layer applies again
hud.theme.effective; // whichever layer is in force
hud.theme.resolved; // "dark" | "light", what is on screen right now
hud.theme.subscribe(() => syncMyPageWith(hud.theme.resolved));
```

The resolved theme lands on `data-theme` of `.perf-hud` and `.perf-monitor`. To restyle either
palette, override the `--perf-*` custom properties (`bg`, `fg`, `fg-dim`, `muted`, `row`,
`border`, `accent`, `shadow`) on those selectors.

## GPU timing

On WebGL2 the monitor uses `EXT_disjoint_timer_query_webgl2`, which Chrome and Edge expose. Safari
and Firefox don't, so the GPU row shows `—` and `sample.gpu.available` is `false`.

On WebGPU, construct the renderer with `trackTimestamp: true`. Timings resolve a frame or two late.

## Environment

The full view's footer has two rows: the three-meter version (linked to its release notes) and the
three revision, then the backend and the GPU name. An amber `WebGL2 fallback` badge means
`WebGPURenderer` couldn't get WebGPU. Its checkbox (off by default) shows the footer in the compact
HUD too. The same data is on the monitor:

```ts
monitor.getEnvironment();
// { three: "186", backend: "webgpu", fallback: false, gpu: "Apple metal-3" }
```

`backend` is `null` until `WebGPURenderer.init()` settles. `gpu` comes from WebGPU's adapter info or
WebGL's unmasked renderer string, and is `null` where the browser hides it. Chrome's WebGPU gives
vendor and architecture, not the model.

## Stutter

Average FPS hides a hitch every few seconds. Three rows in the full view catch it, and any of them
can be ticked into the compact HUD:

- **1% low**: mean FPS across the slowest 1% of frames.
- **Frame p99**: 99% of frames finish within this many ms.
- **Hitches**: frames over twice the median frame time.

They cover the last `frameStatsSize` frames (1000 by default, about 16 s at 60 Hz). Gaps over a
second, like a hidden tab, are left out. Read them with `monitor.getFrameStats()`:

```ts
monitor.getFrameStats();
// { frames: 1000, lowFps: 97.6, p99Ms: 10.2, hitches: 3 }
```

## Bug reports

The **report** row's copy button puts a Markdown snapshot on the clipboard: versions, backend, GPU,
the current metrics, the stutter stats, the viewport and the user agent. Paste it into an issue.
`formatReport(monitor)` from `@zkmake/three-meter/ui` returns the same text.

```text
three-meter v0.5.0 · three r186 · WebGL2 · Apple M4 Max
FPS 120 · 1% low 98 · p99 10.2 ms · hitches 3 / 1,000 frames
CPU 0.2 ms · GPU 0.7 ms
Calls 1 · passes 1 · triangles 24,000 · lines 0 · points 0
Geometries 1 · textures 1 · shaders 1
Viewport 1280×720 @2x
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) …
```

## Examples

[`examples/site`](examples/site) is what runs at [three-meter.pages.dev](https://three-meter.pages.dev/):
one Vite app with both integrations of the same scene, swapped from the header.
[`src/demos/vanilla.ts`](examples/site/src/demos/vanilla.ts) is plain three with `mountPerfHud`;
[`src/demos/r3f.tsx`](examples/site/src/demos/r3f.tsx) is React Three Fiber with `PerfSampler` and
`PerfHud`. `?r3f` opens on Fiber, `?webgpu` uses `WebGPURenderer` in either, `?count=` scales the
scene. The header's theme toggle sets the page theme and the HUD's `theme` layer together; the row
inside the panel overrides the HUD alone. Run `bun run dev` inside it.

## Shipping it

Styles inject at runtime by default. To link them instead, pass `injectStyles: false` and import
`@zkmake/three-meter/styles.css`.

The package never reads `NODE_ENV` or `import.meta.env`. Whether the HUD exists in production is
your call. Gate the import in the app with a `?debug=` query, a build flag or a dynamic `import()`.

## Contract

While a monitor is attached, `renderer.info.autoReset` is off and `begin()` resets `info`. One
monitor per renderer. A second throws. `dispose()` restores everything. Theme with the `--perf-*`
custom properties on `.perf-hud` and `.perf-monitor`, or the `theme` option.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes ship with a changeset.

## License

MIT
