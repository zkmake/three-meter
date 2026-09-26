/**
 * The HUD stylesheet as a string, so the package works without a bundler and
 * injects itself once per document. `.perf-monitor` is the metrics card,
 * `.perf-hud` the floating host around it. Both namespaced so a host page can
 * override safely; the `--perf-*` custom properties are the theming surface.
 *
 * Both elements carry `data-theme="dark" | "light"` (see `HudTheme`) and each
 * resolves its own tokens from it, so the card also themes when mounted on
 * its own, outside a `.perf-hud`.
 */
const STYLE_ATTRIBUTE = "data-three-meter";

const PERF_HUD_STYLES = `
.perf-hud,
.perf-monitor {
  --perf-bg: rgba(22, 24, 29, 0.85);
  --perf-fg: #e6e8eb;
  --perf-fg-dim: #c5c8ce;
  --perf-muted: #8b909a;
  --perf-row: rgba(255, 255, 255, 0.04);
  --perf-border: rgba(255, 255, 255, 0.12);
  --perf-accent: #60a5fa;
  --perf-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);

  color-scheme: dark;
}

.perf-hud[data-theme="light"],
.perf-monitor[data-theme="light"] {
  --perf-bg: rgba(250, 250, 252, 0.88);
  --perf-fg: #1a1c21;
  --perf-fg-dim: #4b5058;
  --perf-muted: #6b7079;
  --perf-row: rgba(0, 0, 0, 0.05);
  --perf-border: rgba(0, 0, 0, 0.12);
  --perf-accent: #2563eb;
  --perf-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);

  color-scheme: light;
}

.perf-monitor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  color: var(--perf-fg);
}

.perf-monitor__graphs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perf-monitor__graph {
  position: relative;
  height: 40px;
  background: var(--perf-row);
  border-radius: 4px;
  overflow: hidden;
}

.perf-monitor__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.perf-monitor__graph-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  pointer-events: none;
}

.perf-monitor__graph-head {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.perf-monitor__graph-overlay .perf-monitor__graph-head {
  pointer-events: auto;
}

.perf-monitor__graph-label {
  color: var(--perf-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}

.perf-monitor__graph-value {
  min-width: 6ch;
  font-weight: 600;
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;
}

.perf-monitor__section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perf-monitor__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.perf-monitor__row:nth-child(even) {
  background: var(--perf-row);
}

.perf-monitor__label {
  flex: 1;
  color: var(--perf-muted);
}

.perf-monitor__icon {
  flex: none;
  width: 12px;
  height: 12px;
  color: var(--perf-muted);
}

.perf-monitor__options {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--perf-border);
}

.perf-monitor__row--static {
  cursor: default;
}

/* Light / system / dark, as a small segmented radio group. */
.perf-monitor__segment {
  display: inline-flex;
  flex: none;
  gap: 1px;
  padding: 1px;
  border-radius: 4px;
  background: var(--perf-row);
}

.perf-monitor__segment-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--perf-muted);
  cursor: pointer;
}

.perf-monitor__segment-option:hover {
  color: var(--perf-fg);
}

.perf-monitor__segment-option[aria-checked="true"] {
  color: var(--perf-fg);
  background: var(--perf-border);
}

.perf-monitor__segment-option:focus-visible {
  outline: 1px solid color-mix(in srgb, var(--perf-accent) 60%, transparent);
  outline-offset: 1px;
}

.perf-monitor__segment-option .perf-monitor__icon {
  width: 11px;
  height: 11px;
  color: inherit;
}

.perf-monitor__button {
  flex: none;
  min-width: 7ch;
  padding: 0 6px;
  border: 1px solid var(--perf-border);
  border-radius: 3px;
  background: var(--perf-row);
  color: var(--perf-fg-dim);
  font: inherit;
  cursor: pointer;
}

.perf-monitor__button:hover {
  color: var(--perf-fg);
}

.perf-monitor__button:focus-visible {
  outline: 1px solid color-mix(in srgb, var(--perf-accent) 60%, transparent);
  outline-offset: 1px;
}

.perf-monitor__checkbox {
  flex: none;
  margin: 0;
  width: 12px;
  height: 12px;
  accent-color: var(--perf-accent);
  cursor: pointer;
}

.perf-monitor__value {
  min-width: 7ch;
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;
}

.perf-monitor__hud {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px;
}

.perf-monitor__hud-graphs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.perf-monitor__hud-graphs:empty {
  display: none;
}

.perf-monitor__hud-graph {
  position: relative;
  height: 28px;
  background: var(--perf-row);
  border-radius: 4px;
  overflow: hidden;
}

.perf-monitor__hud-grid {
  display: grid;
  grid-template-columns: auto 6ch auto 6ch;
  align-items: baseline;
  gap: 2px 8px;
}

.perf-monitor__hud-grid:empty {
  display: none;
}

.perf-monitor__hud-item {
  display: contents;
}

.perf-monitor__hud-label {
  color: var(--perf-muted);
  font-size: 10px;
}

.perf-monitor__hud-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;
}

.perf-monitor__footer {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 6px 0;
  border-top: 1px solid var(--perf-border);
  color: var(--perf-muted);
  font-size: 10px;
}

.perf-monitor__footer-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.perf-monitor__footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.perf-monitor__footer-row[hidden],
.perf-monitor__badge[hidden] {
  display: none;
}

.perf-monitor__footer-gpu {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--perf-fg-dim);
}

.perf-monitor__badge {
  flex: none;
  padding: 0 5px;
  border: 1px solid var(--perf-border);
  border-radius: 3px;
  color: var(--perf-fg-dim);
  letter-spacing: 0.04em;
}

.perf-monitor__badge.is-fallback {
  border-color: #f59e0b;
  color: #f59e0b;
}

.perf-monitor[data-theme="light"] .perf-monitor__badge.is-fallback {
  border-color: #d97706;
  color: #b45309;
}

.perf-monitor__link {
  color: inherit;
  text-decoration: none;
}

.perf-monitor__link:hover,
.perf-monitor__link:focus-visible {
  color: var(--perf-accent);
  text-decoration: underline;
}

.perf-monitor--full .perf-monitor__hud {
  display: none;
}

.perf-monitor--compact .perf-monitor__graphs,
.perf-monitor--compact .perf-monitor__section,
.perf-monitor--compact:not(.perf-monitor--info) .perf-monitor__footer,
.perf-monitor--compact .perf-monitor__footer > .perf-monitor__checkbox {
  display: none;
}

.perf-monitor--compact .perf-monitor__footer {
  padding: 6px 2px 2px;
}

.perf-monitor--compact {
  padding: 4px 8px;
}

.perf-hud {
  position: fixed;
  z-index: 9999;
  /* Safari resolves width:100% canvases against the viewport on a fixed
     host with auto width. Shrink-wrap so expand stays a card, not the window. */
  width: max-content;
  max-width: min(20rem, calc(100vw - 48px));
  overflow: visible;
  background: transparent;
  pointer-events: none;
  user-select: none;
  touch-action: none;
}

.perf-hud--full > .perf-monitor {
  width: 16rem;
  max-width: 100%;
}

.perf-hud > .perf-monitor {
  position: relative;
  z-index: 1;
  max-height: 70vh;
  overflow: auto;
  background: var(--perf-bg);
  border-radius: 6px;
  box-shadow: var(--perf-shadow);
  backdrop-filter: blur(2px);
  pointer-events: auto;
  transition: opacity 0.25s ease;
}

.perf-hud--dim:not(.is-awake):not(.is-dragging) > .perf-monitor {
  opacity: 0.32;
}

.perf-hud__hotspot {
  position: absolute;
  z-index: 0;
  inset: -20px;
  pointer-events: auto;
}

.perf-hud:not([data-edge="right"]) .perf-hud__hotspot {
  right: -46px;
}

.perf-hud[data-edge="right"] .perf-hud__hotspot {
  left: -46px;
}

.perf-hud__tools {
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.perf-hud.is-awake .perf-hud__tools,
.perf-hud.is-dragging .perf-hud__tools {
  opacity: 1;
  pointer-events: auto;
}

/* Inward side: right by default, left when docked to the right edge. */
.perf-hud:not([data-edge="right"]) .perf-hud__tools {
  left: calc(100% + 6px);
}

.perf-hud[data-edge="right"] .perf-hud__tools {
  right: calc(100% + 6px);
}

.perf-hud__disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--perf-bg);
  box-shadow: var(--perf-shadow);
  color: var(--perf-fg-dim);
  cursor: pointer;
  backdrop-filter: blur(2px);
}

.perf-hud__icon {
  width: 12px;
  height: 12px;
}

.perf-hud__drag {
  cursor: grab;
}

.perf-hud.is-dragging .perf-hud__drag {
  cursor: grabbing;
}

.perf-hud__disc:hover,
.perf-hud__disc:focus-visible,
.perf-hud__disc[aria-pressed="true"] {
  color: var(--perf-fg);
  outline: 1px solid color-mix(in srgb, var(--perf-accent) 60%, transparent);
  outline-offset: 1px;
}
`;

/**
 * Append the stylesheet to `target`'s head, once. Call before mounting a view
 * by hand; {@link mountPerfHud} does it for you unless told not to.
 */
const injectStyles = (target: Document = document) => {
  if (target.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)) {
    return;
  }

  const style = target.createElement("style");
  style.setAttribute(STYLE_ATTRIBUTE, "");
  style.textContent = PERF_HUD_STYLES;
  target.head.append(style);
};

export { injectStyles, PERF_HUD_STYLES };
