import { GpuTimer } from "./gpu-timer.ts";
import { RingBuffer } from "./ring-buffer.ts";
import type { PerfRenderer, PerformanceMonitorOptions, Sample, TimingMetric } from "./types.ts";

const DEFAULT_GPU_POOL_SIZE = 5;
/** One monitor per renderer: a second would stack the `render` patch and double-count passes. */
const ATTACHED = new WeakSet<PerfRenderer>();
const DEFAULT_HISTORY_SIZE = 120;
const FPS_SMOOTHING = 0.1;

const frameCalls = (info: PerfRenderer["info"]) => info.render.drawCalls ?? info.render.calls;

const programCount = (info: PerfRenderer["info"]) =>
  info.memory.programs ?? info.programs?.length ?? 0;

/**
 * Collector of three.js frame metrics. Bracket each frame with {@link begin}/
 * {@link end} — or let {@link wrapAnimationLoop} / the R3F `PerfSampler` do it.
 * Works on WebGPURenderer (drawCalls, memory.programs, timestamp queries) and
 * on a WebGL renderer (calls, programs[], timer-query ext).
 *
 * While attached, `renderer.info.autoReset` is off and `info` is reset in
 * {@link begin}; host code that reads `renderer.info` mid-frame sees this
 * frame's counts only. {@link dispose} restores both.
 */
class PerformanceMonitor {
  private readonly renderer: PerfRenderer;
  private readonly gpuTimer: GpuTimer | null;
  private readonly originalRender: PerfRenderer["render"];
  private renderPasses = 0;
  private readonly fpsHistory: RingBuffer;
  private readonly cpuHistory: RingBuffer;
  private readonly gpuHistory: RingBuffer;
  private cpuStart = 0;
  private lastBeginAt: number | null = null;
  private frameFps = 0;
  private smoothedFps = 0;
  private sample: Sample;

  constructor(options: PerformanceMonitorOptions) {
    const {
      renderer,
      trackGPU = true,
      gpuQueryPoolSize = DEFAULT_GPU_POOL_SIZE,
      historySize = DEFAULT_HISTORY_SIZE,
    } = options;

    if (ATTACHED.has(renderer)) {
      throw new Error(
        "three-meter: a PerformanceMonitor is already attached to this renderer. dispose() it first.",
      );
    }

    ATTACHED.add(renderer);
    this.renderer = renderer;
    renderer.info.autoReset = false;
    this.originalRender = renderer.render;

    renderer.render = (...args: never[]) => {
      this.renderPasses += 1;

      return this.originalRender.apply(renderer, args);
    };

    this.gpuTimer = trackGPU ? GpuTimer.create(renderer, gpuQueryPoolSize) : null;
    this.fpsHistory = new RingBuffer(historySize);
    this.cpuHistory = new RingBuffer(historySize);
    this.gpuHistory = new RingBuffer(historySize);
    this.sample = this.buildEmptySample();
  }

  begin() {
    const now = performance.now();

    if (this.lastBeginAt !== null) {
      const frameMs = now - this.lastBeginAt;
      this.frameFps = frameMs > 0 ? 1000 / frameMs : 0;
    }

    this.lastBeginAt = now;
    this.cpuStart = now;
    this.renderPasses = 0;
    this.renderer.info.reset();
    this.gpuTimer?.begin();
  }

  end() {
    const now = performance.now();
    const cpu = now - this.cpuStart;

    this.gpuTimer?.end();
    this.gpuTimer?.poll();

    const gpuMs = this.gpuTimer?.getMs() ?? 0;

    this.smoothedFps =
      this.smoothedFps === 0
        ? this.frameFps
        : this.smoothedFps + (this.frameFps - this.smoothedFps) * FPS_SMOOTHING;

    this.fpsHistory.push(this.frameFps);
    this.cpuHistory.push(cpu);
    this.gpuHistory.push(gpuMs);

    const info = this.renderer.info;

    this.sample = Object.freeze({
      cpu,
      fps: this.smoothedFps,
      gpu: { available: this.gpuTimer !== null, ms: gpuMs },
      render: {
        calls: frameCalls(info),
        lines: info.render.lines,
        passes: this.renderPasses,
        points: info.render.points,
        triangles: info.render.triangles,
      },
      resources: {
        geometries: info.memory.geometries,
        programs: programCount(info),
        textures: info.memory.textures,
      },
    });
  }

  getSample(): Sample {
    return this.sample;
  }

  getHistory(metric: TimingMetric): readonly number[] {
    switch (metric) {
      case "fps":
        return this.fpsHistory.toArray();
      case "cpu":
        return this.cpuHistory.toArray();
      case "gpu":
        return this.gpuHistory.toArray();
    }
  }

  dispose() {
    ATTACHED.delete(this.renderer);
    this.renderer.info.autoReset = true;
    this.renderer.render = this.originalRender;
    this.gpuTimer?.dispose();
    this.fpsHistory.clear();
    this.cpuHistory.clear();
    this.gpuHistory.clear();
  }

  private buildEmptySample(): Sample {
    return Object.freeze({
      cpu: 0,
      fps: 0,
      gpu: { available: this.gpuTimer !== null, ms: 0 },
      render: { calls: 0, lines: 0, passes: 0, points: 0, triangles: 0 },
      resources: { geometries: 0, programs: 0, textures: 0 },
    });
  }
}

export { PerformanceMonitor };
