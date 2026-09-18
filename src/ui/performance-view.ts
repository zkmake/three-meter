import type { PerformanceMonitor } from "../core/performance-monitor.ts";
import type { Sample, TimingMetric } from "../core/types.ts";
import { HudSettings } from "./hud-settings.ts";
import { createIcon } from "./icons.ts";
import { drawSparkline, type SparklineStyle } from "./sparkline.ts";
import { applyTheme, HudTheme, type ResolvedTheme } from "./theme.ts";

type PerformanceViewMode = "full" | "compact";

type PerformanceViewOptions = {
  monitor: PerformanceMonitor;
  /** `full` is the checkbox list; `compact` the card it configures. Default `full`. */
  mode?: PerformanceViewMode;
  /** Repaint rate. Default 10. */
  refreshHz?: number;
  /** Share one between views to keep them in sync; a fresh instance otherwise. */
  settings?: HudSettings;
  /**
   * Share the host's so the card and its chrome switch together. Otherwise a
   * fresh `system` instance is created and disposed with the view.
   */
  theme?: HudTheme;
};

type TimingConfig = {
  format: (value: number) => string;
  label: string;
  metric: TimingMetric;
  /** Canvas can't read CSS custom properties, so the sparkline palette lives here per theme. */
  style: Record<ResolvedTheme, SparklineStyle>;
  unit: string;
};

type NumberConfig = {
  key: string;
  label: string;
  read: (sample: Sample) => string;
};

const TIMINGS: TimingConfig[] = [
  {
    format: (value) => Math.round(value).toString(),
    label: "FPS",
    metric: "fps",
    style: {
      dark: { fill: "rgba(74, 222, 128, 0.15)", stroke: "#4ade80" },
      light: { fill: "rgba(22, 163, 74, 0.12)", stroke: "#16a34a" },
    },
    unit: "",
  },
  {
    format: (value) => value.toFixed(1),
    label: "CPU",
    metric: "cpu",
    style: {
      dark: { fill: "rgba(96, 165, 250, 0.15)", stroke: "#60a5fa" },
      light: { fill: "rgba(37, 99, 235, 0.12)", stroke: "#2563eb" },
    },
    unit: "ms",
  },
  {
    format: (value) => value.toFixed(1),
    label: "GPU",
    metric: "gpu",
    style: {
      dark: { fill: "rgba(244, 114, 182, 0.15)", stroke: "#f472b6" },
      light: { fill: "rgba(219, 39, 119, 0.12)", stroke: "#db2777" },
    },
    unit: "ms",
  },
];

const formatCount = (value: number) => value.toLocaleString("en-US");

const readTiming = (sample: Sample, metric: TimingMetric) => {
  switch (metric) {
    case "fps":
      return sample.fps;
    case "cpu":
      return sample.cpu;
    case "gpu":
      return sample.gpu.ms;
  }
};

const isTimingAvailable = (sample: Sample, metric: TimingMetric) =>
  metric !== "gpu" || sample.gpu.available;

const NUMBERS: NumberConfig[] = [
  { key: "fps", label: "FPS", read: (sample) => Math.round(sample.fps).toString() },
  { key: "calls", label: "Calls", read: (sample) => formatCount(sample.render.calls) },
  { key: "cpu", label: "CPU", read: (sample) => sample.cpu.toFixed(1) },
  {
    key: "gpu",
    label: "GPU",
    read: (sample) => (sample.gpu.available ? sample.gpu.ms.toFixed(1) : "—"),
  },
  {
    key: "triangles",
    label: "Triangles",
    read: (sample) => formatCount(sample.render.triangles),
  },
  { key: "lines", label: "Lines", read: (sample) => formatCount(sample.render.lines) },
  { key: "points", label: "Points", read: (sample) => formatCount(sample.render.points) },
  {
    key: "passes",
    label: "Render passes",
    read: (sample) => formatCount(sample.render.passes),
  },
  {
    key: "geometries",
    label: "Geometries",
    read: (sample) => formatCount(sample.resources.geometries),
  },
  {
    key: "textures",
    label: "Textures",
    read: (sample) => formatCount(sample.resources.textures),
  },
  {
    key: "shaders",
    label: "Shaders",
    read: (sample) => formatCount(sample.resources.programs),
  },
];

type GraphCanvas = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  height: number;
  width: number;
};

type HudGraph = GraphCanvas & {
  valueEl: HTMLElement;
};

/**
 * Host-agnostic widget that paints {@link Sample}s. Mount {@link element}
 * anywhere; the view drives its own throttled repaint. Compact is the floating
 * HUD; full is the checkbox list that chooses what compact shows. Styles are
 * not injected here. Call `injectStyles()` or use `mountPerfHud`.
 */
class PerformanceView {
  readonly element: HTMLDivElement;
  readonly settings: HudSettings;
  readonly theme: HudTheme;

  private readonly ownsTheme: boolean;
  private readonly unsubscribeTheme: () => void;
  private readonly monitor: PerformanceMonitor;
  private readonly minIntervalMs: number;
  private mode: PerformanceViewMode;
  private readonly graphValueEls = new Map<TimingMetric, HTMLElement>();
  private readonly graphCanvases = new Map<TimingMetric, GraphCanvas>();
  private readonly graphCheckboxes = new Map<TimingMetric, HTMLInputElement>();
  private readonly statValueEls = new Map<string, HTMLElement>();
  private readonly statCheckboxes = new Map<string, HTMLInputElement>();
  private dimCheckbox!: HTMLInputElement;
  private hudGraphsEl!: HTMLElement;
  private hudGridEl!: HTMLElement;
  private readonly hudGraphs = new Map<TimingMetric, HudGraph>();
  private readonly hudNumberEls = new Map<string, HTMLElement>();
  private rafId: number | null = null;
  private lastPaintAt = 0;
  private readonly resizeObserver: ResizeObserver;
  private readonly unsubscribe: () => void;

  constructor(options: PerformanceViewOptions) {
    this.monitor = options.monitor;
    this.settings = options.settings ?? new HudSettings();
    this.ownsTheme = !options.theme;
    this.theme = options.theme ?? new HudTheme();
    this.mode = options.mode ?? "full";
    this.minIntervalMs = 1000 / (options.refreshHz ?? 10);
    this.element = document.createElement("div");
    this.element.className = "perf-monitor";
    this.applyModeClass();
    applyTheme(this.element, this.theme);
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvases());
    this.build();
    this.rebuildHud();
    this.unsubscribe = this.settings.subscribe(() => this.onSelectionChanged());
    this.unsubscribeTheme = this.theme.subscribe(() => applyTheme(this.element, this.theme));
  }

  start() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.frame);
    }
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setMode(mode: PerformanceViewMode) {
    if (mode === this.mode) {
      return;
    }

    this.mode = mode;
    this.applyModeClass();
    this.resizeCanvases();
  }

  getMode() {
    return this.mode;
  }

  dispose() {
    this.stop();
    this.unsubscribe();
    this.unsubscribeTheme();

    if (this.ownsTheme) {
      this.theme.dispose();
    }

    this.resizeObserver.disconnect();
    this.element.remove();
  }

  private frame = (now: number) => {
    this.rafId = requestAnimationFrame(this.frame);

    if (now - this.lastPaintAt < this.minIntervalMs) {
      return;
    }

    this.lastPaintAt = now;
    this.render();
  };

  private render() {
    const sample = this.monitor.getSample();

    if (this.mode === "compact") {
      this.renderHud(sample);

      return;
    }

    for (const config of TIMINGS) {
      const available = isTimingAvailable(sample, config.metric);
      const valueEl = this.graphValueEls.get(config.metric)!;
      valueEl.textContent = available
        ? this.formatTiming(config, readTiming(sample, config.metric))
        : "unavailable";

      const graph = this.graphCanvases.get(config.metric)!;
      drawSparkline(
        graph.ctx,
        graph.width,
        graph.height,
        available ? this.monitor.getHistory(config.metric) : [],
        config.style[this.theme.resolved],
      );
    }

    for (const config of NUMBERS) {
      this.statValueEls.get(config.key)!.textContent = config.read(sample);
    }
  }

  private renderHud(sample: Sample) {
    for (const [key, element] of this.hudNumberEls) {
      const config = NUMBERS.find((number) => number.key === key);

      if (config) {
        element.textContent = config.read(sample);
      }
    }

    for (const [metric, graph] of this.hudGraphs) {
      const config = TIMINGS.find((timing) => timing.metric === metric)!;
      const available = isTimingAvailable(sample, metric);

      graph.valueEl.textContent = available
        ? this.formatTiming(config, readTiming(sample, metric))
        : "—";

      drawSparkline(
        graph.ctx,
        graph.width,
        graph.height,
        available ? this.monitor.getHistory(metric) : [],
        config.style[this.theme.resolved],
      );
    }
  }

  private formatTiming(config: TimingConfig, value: number) {
    return `${config.format(value)}${config.unit ? ` ${config.unit}` : ""}`;
  }

  private build() {
    const hud = document.createElement("div");
    hud.className = "perf-monitor__hud";
    this.hudGraphsEl = document.createElement("div");
    this.hudGraphsEl.className = "perf-monitor__hud-graphs";
    this.hudGridEl = document.createElement("div");
    this.hudGridEl.className = "perf-monitor__hud-grid";
    hud.append(this.hudGraphsEl, this.hudGridEl);

    const options = document.createElement("div");
    options.className = "perf-monitor__section perf-monitor__options";

    const dimRow = document.createElement("label");
    dimRow.className = "perf-monitor__row";

    this.dimCheckbox = this.buildCheckbox(
      this.settings.dim,
      "Dim the performance panel when the pointer leaves",
      (on) => this.settings.setDim(on),
    );

    const dimLabel = document.createElement("span");
    dimLabel.className = "perf-monitor__label";
    dimLabel.textContent = "dim on leave";

    dimRow.append(this.dimCheckbox, createIcon("blend", "perf-monitor__icon"), dimLabel);
    options.append(dimRow);

    const graphs = document.createElement("div");
    graphs.className = "perf-monitor__graphs";

    for (const config of TIMINGS) {
      const graph = document.createElement("div");
      graph.className = "perf-monitor__graph";

      const canvas = document.createElement("canvas");
      canvas.className = "perf-monitor__canvas";

      const overlay = document.createElement("div");
      overlay.className = "perf-monitor__graph-overlay";

      const head = document.createElement("label");
      head.className = "perf-monitor__graph-head";

      const checkbox = this.buildCheckbox(
        this.settings.isGraphEnabled(config.metric),
        `Show ${config.label} graph in HUD`,
        (on) => this.settings.setGraphEnabled(config.metric, on),
      );
      this.graphCheckboxes.set(config.metric, checkbox);

      const label = document.createElement("span");
      label.className = "perf-monitor__graph-label";
      label.textContent = config.label;

      const value = document.createElement("span");
      value.className = "perf-monitor__graph-value";
      value.textContent = "—";
      this.graphValueEls.set(config.metric, value);

      head.append(checkbox, label);
      overlay.append(head, value);
      graph.append(canvas, overlay);
      graphs.append(graph);

      const ctx = canvas.getContext("2d");

      if (ctx) {
        this.graphCanvases.set(config.metric, { canvas, ctx, height: 0, width: 0 });
        this.resizeObserver.observe(graph);
      }
    }

    const stats = document.createElement("div");
    stats.className = "perf-monitor__section";

    for (const config of NUMBERS) {
      const rowEl = document.createElement("label");
      rowEl.className = "perf-monitor__row";

      const checkbox = this.buildCheckbox(
        this.settings.isNumberEnabled(config.key),
        `Show ${config.label} in HUD`,
        (on) => this.settings.setNumberEnabled(config.key, on),
      );
      this.statCheckboxes.set(config.key, checkbox);

      const label = document.createElement("span");
      label.className = "perf-monitor__label";
      label.textContent = config.label;

      const value = document.createElement("span");
      value.className = "perf-monitor__value";
      value.textContent = "—";
      this.statValueEls.set(config.key, value);

      rowEl.append(checkbox, label, value);
      stats.append(rowEl);
    }

    this.element.append(hud, options, graphs, stats);
  }

  private rebuildHud() {
    const { selection } = this.settings;

    for (const graph of this.hudGraphs.values()) {
      this.resizeObserver.unobserve(graph.canvas.parentElement ?? graph.canvas);
    }

    this.hudGraphs.clear();
    this.hudNumberEls.clear();
    this.hudGraphsEl.replaceChildren();
    this.hudGridEl.replaceChildren();

    for (const config of TIMINGS) {
      if (!selection.graphs.has(config.metric)) {
        continue;
      }

      const row = document.createElement("div");
      row.className = "perf-monitor__hud-graph";

      const canvas = document.createElement("canvas");
      canvas.className = "perf-monitor__canvas";

      const overlay = document.createElement("div");
      overlay.className = "perf-monitor__graph-overlay";

      const label = document.createElement("span");
      label.className = "perf-monitor__graph-label";
      label.textContent = config.label;

      const value = document.createElement("span");
      value.className = "perf-monitor__graph-value";
      value.textContent = "—";

      overlay.append(label, value);
      row.append(canvas, overlay);
      this.hudGraphsEl.append(row);

      const ctx = canvas.getContext("2d");

      if (ctx) {
        this.hudGraphs.set(config.metric, { canvas, ctx, height: 0, valueEl: value, width: 0 });
        this.resizeObserver.observe(row);
      }
    }

    for (const config of NUMBERS) {
      if (!selection.numbers.has(config.key)) {
        continue;
      }

      const item = document.createElement("div");
      item.className = "perf-monitor__hud-item";

      const label = document.createElement("span");
      label.className = "perf-monitor__hud-label";
      label.textContent = config.label;

      const value = document.createElement("span");
      value.className = "perf-monitor__hud-value";
      value.textContent = "—";

      item.append(label, value);
      this.hudGridEl.append(item);
      this.hudNumberEls.set(config.key, value);
    }

    this.resizeCanvases();
  }

  private onSelectionChanged() {
    for (const [metric, checkbox] of this.graphCheckboxes) {
      checkbox.checked = this.settings.isGraphEnabled(metric);
    }

    for (const [key, checkbox] of this.statCheckboxes) {
      checkbox.checked = this.settings.isNumberEnabled(key);
    }

    this.dimCheckbox.checked = this.settings.dim;
    this.rebuildHud();
  }

  private buildCheckbox(checked: boolean, title: string, onChange: (enabled: boolean) => void) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "perf-monitor__checkbox";
    checkbox.checked = checked;
    checkbox.title = title;
    checkbox.setAttribute("aria-label", title);
    checkbox.addEventListener("change", () => onChange(checkbox.checked));

    return checkbox;
  }

  private applyModeClass() {
    this.element.classList.toggle("perf-monitor--compact", this.mode === "compact");
    this.element.classList.toggle("perf-monitor--full", this.mode === "full");
  }

  private resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;

    const sizeAll = (graphs: Iterable<GraphCanvas>) => {
      for (const graph of graphs) {
        const { canvas, ctx } = graph;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (width === 0 || height === 0) {
          continue;
        }

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        graph.width = width;
        graph.height = height;
      }
    };

    sizeAll(this.graphCanvases.values());
    sizeAll(this.hudGraphs.values());
  }
}

export { PerformanceView };
export type { PerformanceViewMode, PerformanceViewOptions };
