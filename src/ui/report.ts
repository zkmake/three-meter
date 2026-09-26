/**
 * A plain-text snapshot of the monitor for bug reports: versions, backend and
 * GPU, the current sample, stutter stats and the page. Fenced as a `text`
 * code block so GitHub and Slack keep the line breaks.
 */
import { version } from "../../package.json";
import type { PerformanceMonitor } from "../core/performance-monitor.ts";
import type { Environment, FrameStats, Sample } from "../core/types.ts";
import { formatCount } from "./format.ts";

type ReportPage = {
  dpr: number;
  height: number;
  userAgent: string;
  width: number;
};

type ReportData = {
  environment: Environment;
  page: ReportPage | null;
  sample: Sample;
  stats: FrameStats;
};

const BACKEND_LABELS = { webgl: "WebGL", webgl2: "WebGL2", webgpu: "WebGPU" } as const;

/** `WebGPU`, `WebGL2`, `WebGL2 fallback`, or `""` before the backend settles. */
const backendLabel = (environment: Environment) => {
  if (!environment.backend) {
    return "";
  }

  const label = BACKEND_LABELS[environment.backend];

  return environment.fallback ? `${label} fallback` : label;
};

const ms = (value: number) => `${value.toFixed(1)} ms`;

const renderReport = ({ environment, page, sample, stats }: ReportData): string => {
  const { render, resources } = sample;
  const heading = [
    `three-meter v${version}`,
    environment.three ? `three r${environment.three}` : "",
    backendLabel(environment),
    environment.gpu ?? "",
  ].filter(Boolean);

  const frames =
    stats.frames === 0
      ? `FPS ${Math.round(sample.fps)}`
      : [
          `FPS ${Math.round(sample.fps)}`,
          `1% low ${Math.round(stats.lowFps)}`,
          `p99 ${ms(stats.p99Ms)}`,
          `hitches ${formatCount(stats.hitches)} / ${formatCount(stats.frames)} frames`,
        ].join(" · ");

  const lines = [
    heading.join(" · "),
    frames,
    `CPU ${ms(sample.cpu)} · GPU ${sample.gpu.available ? ms(sample.gpu.ms) : "unavailable"}`,
    [
      `Calls ${formatCount(render.calls)}`,
      `passes ${formatCount(render.passes)}`,
      `triangles ${formatCount(render.triangles)}`,
      `lines ${formatCount(render.lines)}`,
      `points ${formatCount(render.points)}`,
    ].join(" · "),
    [
      `Geometries ${formatCount(resources.geometries)}`,
      `textures ${formatCount(resources.textures)}`,
      `shaders ${formatCount(resources.programs)}`,
    ].join(" · "),
  ];

  if (page) {
    lines.push(`Viewport ${page.width}×${page.height} @${page.dpr}x`, page.userAgent);
  }

  return ["```text", ...lines, "```"].join("\n");
};

const readPage = (): ReportPage | null =>
  typeof window === "undefined"
    ? null
    : {
        dpr: window.devicePixelRatio || 1,
        height: window.innerHeight,
        userAgent: navigator.userAgent,
        width: window.innerWidth,
      };

/** The report for `monitor` right now, as Markdown ready to paste into an issue. */
const formatReport = (monitor: PerformanceMonitor): string =>
  renderReport({
    environment: monitor.getEnvironment(),
    page: readPage(),
    sample: monitor.getSample(),
    stats: monitor.getFrameStats(),
  });

export { backendLabel, formatReport, renderReport };
export type { ReportData, ReportPage };
