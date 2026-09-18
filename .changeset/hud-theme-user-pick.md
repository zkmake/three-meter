---
"@zkmake/three-meter": minor
---

Let the person using the HUD pick its theme. The full view gains a light / system / dark row; the
pick persists with the other settings under `storageKey` (`HudSettings.theme`, `setTheme`) and sits
on top of the consumer's `theme` option, which still applies whenever nothing has been picked.
`HudTheme` exposes the layers as `mode` (consumer), `override` (panel pick) and `effective`, with
`setOverride` to drive the top layer; `resolved` follows `effective`.
