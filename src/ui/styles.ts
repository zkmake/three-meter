/**
 * The HUD stylesheet as a string, so the package works without a bundler and
 * injects itself once per document. `.perf-monitor` is the metrics card,
 * `.perf-hud` the floating host around it. Both namespaced so a host page can
 * override safely; the `--perf-*` custom properties are the theming surface.
 */
const STYLE_ATTRIBUTE = "data-three-meter";

const PERF_HUD_STYLES = `
.perf-monitor {
  --perf-bg: #16181d;
  --perf-fg: #e6e8eb;
  --perf-muted: #8b909a;
  --perf-row: rgba(255, 255, 255, 0.04);

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
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.perf-monitor__checkbox {
  flex: none;
  margin: 0;
  width: 12px;
  height: 12px;
  accent-color: #60a5fa;
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

.perf-monitor--full .perf-monitor__hud {
  display: none;
}

.perf-monitor--compact .perf-monitor__graphs,
.perf-monitor--compact .perf-monitor__section {
  display: none;
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
  background: rgba(22, 24, 29, 0.85);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
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
  background: rgba(22, 24, 29, 0.85);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
  color: #c5c8ce;
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
  color: #e6e8eb;
  outline: 1px solid rgba(96, 165, 250, 0.6);
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
