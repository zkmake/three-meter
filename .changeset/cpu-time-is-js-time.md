---
"@zkmake/three-meter": patch
---

Three measurement and lifecycle fixes.

- **CPU was the frame interval, not JS time.** `end()` ran at the start of the next tick, so `cpu`
  equalled `1000 / fps` whenever the loop was vsync-bound and never showed headroom. CPU now runs
  from `begin()` to the return of the frame's last `render()` call (stamped by the existing
  `render` patch), in both `wrapAnimationLoop` and `PerfSampler`. `wrapAnimationLoop` also
  brackets the frame inside the tick and closes it even if your loop throws.
- **Stalls no longer flatten the graphs.** A frame interval over one second (hidden tab,
  breakpoint) is left out of FPS instead of logging a near-zero sample that dominated the
  sparkline scale for the whole history window.
- **`PerfHud` no longer remounts on every render** when `defaultPlacement` is an inline object
  literal; it is compared by value. `mode` and `label` now apply live through the handle, like
  `theme`.
