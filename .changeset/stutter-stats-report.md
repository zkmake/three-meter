---
"@zkmake/three-meter": minor
---

Stutter stats and a copyable bug report. The full view gains 1% low, frame p99 and hitch rows over the last `frameStatsSize` frames (default 1000), available to the compact HUD like any other row and through `PerformanceMonitor.getFrameStats()`. A new report row copies a Markdown snapshot (versions, backend, GPU, metrics, stutter stats, viewport, user agent) to the clipboard; `formatReport(monitor)` returns the same text.
