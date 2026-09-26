---
"@zkmake/three-meter": minor
---

Budgets. A value past its budget turns amber in the full view and the compact HUD, with a tooltip naming the budget, and the FPS / CPU / GPU graphs draw it as a dashed line once the series reaches it. Timing budgets default from `targetFps` (60): FPS ≥ 95% of it, 1% low ≥ half, CPU and GPU within a frame, p99 within one and a half. Set your own with the `budgets` option on `mountPerfHud`, `PerfHud` and `PerformanceView` (e.g. `{ targetFps: 120, calls: 500 }`; `null` drops a default, `false` drops all), or later with `hud.setBudgets()`. New `--perf-warn` theme token.
