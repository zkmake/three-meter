# @zkmake/three-meter

Frame metrics for a three.js renderer: FPS, CPU ms, GPU ms, draw calls, render passes, triangles,
geometries, textures and programs, with a small dockable HUD. Zero dependencies. Works with
`WebGLRenderer` and `WebGPURenderer`, with or without React.

```sh
bun add -d @zkmake/three-meter   # or npm i -D / pnpm add -D
```

Live demo: [three-meter.pages.dev](https://three-meter.pages.dev/). Add `?webgpu` for the WebGPU
renderer and `?count=5000` to load the scene up.

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

`PerformanceMonitor` and `PerfSampler` take `trackGPU` (default true), `gpuQueryPoolSize` (default 5)
and `historySize` (default 120).

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

## Examples

[`examples/vanilla`](examples/vanilla) is plain three and is what runs at
[three-meter.pages.dev](https://three-meter.pages.dev/). Add `?webgpu` to use `WebGPURenderer` and
`?count=` to scale the scene. Its header toggle sets the page theme and the HUD's `theme` layer
together; the row inside the panel overrides the HUD alone. [`examples/r3f`](examples/r3f) is the
React Three Fiber version. Each is a Vite app. Run `bun run dev` inside it.

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
