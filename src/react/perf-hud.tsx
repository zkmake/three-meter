import { useEffect } from "react";

import { mountPerfHud, type MountPerfHudOptions } from "../ui/mount-perf-hud.ts";
import { defaultPerfMonitorStore, type PerfMonitorStore } from "./monitor-store.ts";

type PerfHudProps = Omit<MountPerfHudOptions, "settings"> & {
  /** Must match the `PerfSampler`'s. Default: the shared store. */
  store?: PerfMonitorStore;
};

/**
 * DOM overlay. Render it *outside* `<Canvas>`, or Fiber would treat its markup
 * as three objects. Mounts the dockable HUD whenever a `PerfSampler` has
 * published a monitor and tears it down when that sampler unmounts.
 */
function PerfHud({
  defaultPlacement,
  injectStyles,
  label,
  mode,
  parent,
  refreshHz,
  storageKey,
  store,
}: PerfHudProps) {
  const source = store ?? defaultPerfMonitorStore;

  useEffect(() => {
    let dispose: (() => void) | null = null;

    const attach = (monitor: ReturnType<PerfMonitorStore["get"]>) => {
      dispose?.();
      dispose = null;

      if (!monitor) {
        return;
      }

      dispose = mountPerfHud(monitor, {
        defaultPlacement,
        injectStyles,
        label,
        mode,
        parent,
        refreshHz,
        storageKey,
      }).dispose;
    };

    const unsubscribe = source.subscribe(attach);
    attach(source.get());

    return () => {
      unsubscribe();
      dispose?.();
    };
  }, [defaultPlacement, injectStyles, label, mode, parent, refreshHz, source, storageKey]);

  return null;
}

export { PerfHud };
export type { PerfHudProps };
