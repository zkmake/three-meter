---
"@zkmake/three-meter": minor
---

Add a light palette and a `theme` option to `mountPerfHud` and `PerfHud`: `dark`, `light`, or
`system` (the default), which follows `prefers-color-scheme` live. The handle gains `getTheme`,
`setTheme` and a `theme` controller whose `resolved` value and `subscribe` let a host page follow
the HUD. In React the `theme` prop applies without remounting. Every colour in the stylesheet now
comes from a `--perf-*` custom property, and the resolved theme lands on `data-theme` of `.perf-hud`
and `.perf-monitor`.
