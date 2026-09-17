import { describe, expect, test } from "vitest";

import { PerformanceMonitor } from "./performance-monitor.ts";
import type { PerfRenderer } from "./types.ts";

type FakeRenderer = PerfRenderer & { renders: number };

const fakeWebgl = (): FakeRenderer => {
  const renderer: FakeRenderer = {
    info: {
      autoReset: true,
      memory: { geometries: 3, textures: 2 },
      programs: { length: 4 },
      render: { calls: 11, lines: 1, points: 0, triangles: 900 },
      reset: () => {
        renderer.info.render.calls = 0;
      },
    },
    render: () => {
      renderer.renders += 1;
      renderer.info.render.calls = 11;
    },
    renders: 0,
  };

  return renderer;
};

const fakeWebgpu = (): PerfRenderer => ({
  backend: { trackTimestamp: false },
  info: {
    autoReset: true,
    memory: { geometries: 1, programs: 9, textures: 1 },
    render: { calls: 0, drawCalls: 7, lines: 0, points: 0, triangles: 10 },
    reset: () => {},
  },
  render: () => {},
});

describe("PerformanceMonitor", () => {
  test("counts render passes between begin and end, and reads WebGL fields", () => {
    const renderer = fakeWebgl();
    const monitor = new PerformanceMonitor({ renderer, trackGPU: false });

    expect(renderer.info.autoReset).toBe(false);

    monitor.begin();
    renderer.render();
    renderer.render();
    monitor.end();

    const sample = monitor.getSample();
    expect(sample.render.passes).toBe(2);
    expect(sample.render.calls).toBe(11);
    expect(sample.resources.programs).toBe(4);
    expect(sample.gpu.available).toBe(false);
    expect(renderer.renders).toBe(2);

    monitor.dispose();
  });

  test("prefers WebGPU drawCalls and memory.programs when present", () => {
    const monitor = new PerformanceMonitor({ renderer: fakeWebgpu(), trackGPU: false });
    monitor.begin();
    monitor.end();

    expect(monitor.getSample().render.calls).toBe(7);
    expect(monitor.getSample().resources.programs).toBe(9);
    monitor.dispose();
  });

  test("dispose restores render and autoReset, and frees the renderer", () => {
    const renderer = fakeWebgl();
    const original = renderer.render;
    const monitor = new PerformanceMonitor({ renderer, trackGPU: false });

    expect(renderer.render).not.toBe(original);
    monitor.dispose();

    expect(renderer.render).toBe(original);
    expect(renderer.info.autoReset).toBe(true);
    expect(() => new PerformanceMonitor({ renderer, trackGPU: false }).dispose()).not.toThrow();
  });

  test("refuses a second monitor on the same renderer", () => {
    const renderer = fakeWebgl();
    const monitor = new PerformanceMonitor({ renderer, trackGPU: false });

    expect(() => new PerformanceMonitor({ renderer, trackGPU: false })).toThrow(/already attached/);
    monitor.dispose();
  });

  test("keeps a bounded history per metric", () => {
    const monitor = new PerformanceMonitor({
      historySize: 3,
      renderer: fakeWebgl(),
      trackGPU: false,
    });

    for (let index = 0; index < 5; index += 1) {
      monitor.begin();
      monitor.end();
    }

    expect(monitor.getHistory("cpu")).toHaveLength(3);
    monitor.dispose();
  });
});
