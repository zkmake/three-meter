import type { PerformanceMonitor } from "./performance-monitor.ts";

type AnimationLoop<Args extends unknown[]> = (...args: Args) => void;

/**
 * Wrap a `renderer.setAnimationLoop` callback so each tick closes the previous
 * frame and opens the next — the same bracketing the R3F sampler does. CPU time
 * therefore spans the whole tick (your update code plus the render dispatch).
 *
 * ```ts
 * renderer.setAnimationLoop(wrapAnimationLoop(monitor, (time) => { … renderer.render(scene, camera); }));
 * ```
 */
function wrapAnimationLoop<Args extends unknown[]>(
  monitor: PerformanceMonitor,
  loop: AnimationLoop<Args>,
): AnimationLoop<Args> {
  let started = false;

  return (...args) => {
    if (started) {
      monitor.end();
    }

    started = true;
    monitor.begin();
    loop(...args);
  };
}

export { wrapAnimationLoop };
