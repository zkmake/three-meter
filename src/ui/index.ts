/**
 * `@zkmake/three-meter/ui`: the DOM. `mountPerfHud` is the one-liner
 * (dockable card, discs, dim-on-leave, persisted selection); the pieces underneath are
 * exported for hosts that want to compose their own panel.
 */

export { dockPanel } from "./dock-panel.ts";
export { DEFAULT_STORAGE_KEY, HudSettings } from "./hud-settings.ts";
export { mountPerfHud } from "./mount-perf-hud.ts";
export { PerformanceView } from "./performance-view.ts";
export { injectStyles, PERF_HUD_STYLES } from "./styles.ts";
export type {
  DefaultPlacement,
  DockAlign,
  DockHandle,
  DockPanelOptions,
  Placement,
  ScreenEdge,
} from "./dock-panel.ts";
export type { HudDefaults, HudSelection, HudSettingsOptions } from "./hud-settings.ts";
export type { MountPerfHudOptions, PerfHudHandle } from "./mount-perf-hud.ts";
export type { PerformanceViewMode, PerformanceViewOptions } from "./performance-view.ts";
