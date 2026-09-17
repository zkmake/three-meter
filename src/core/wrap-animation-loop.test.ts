import { describe, expect, test, vi } from "vitest";

import type { PerformanceMonitor } from "./performance-monitor.ts";
import { wrapAnimationLoop } from "./wrap-animation-loop.ts";

describe("wrapAnimationLoop", () => {
  test("opens a frame on the first tick and closes the previous one after", () => {
    const monitor = { begin: vi.fn(), end: vi.fn() } as unknown as PerformanceMonitor;
    const loop = vi.fn();
    const wrapped = wrapAnimationLoop(monitor, loop);

    wrapped(16);
    expect(monitor.end).not.toHaveBeenCalled();
    expect(monitor.begin).toHaveBeenCalledTimes(1);
    expect(loop).toHaveBeenCalledWith(16);

    wrapped(32);
    expect(monitor.end).toHaveBeenCalledTimes(1);
    expect(monitor.begin).toHaveBeenCalledTimes(2);
  });
});
