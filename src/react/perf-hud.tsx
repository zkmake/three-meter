import { useEffect, useRef } from "react";

import {
  mountPerfHud,
  type MountPerfHudOptions,
  type PerfHudHandle,
} from "../ui/mount-perf-hud.ts";
import { defaultPerfMonitorStore, type PerfMonitorStore } from "./monitor-store.ts";

type PerfHudProps = Omit<MountPerfHudOptions, "settings"> & {
  /** Must match the `PerfSampler`'s. Default: the shared store. */
  store?: PerfMonitorStore;
};

/**
 * DOM overlay. Render it *outside* `<Canvas>`, or Fiber would treat its markup
 * as three objects. Mounts the dockable HUD whenever a `PerfSampler` has
 * published a monitor and tears it down when that sampler unmounts.
 *
 * `theme`, `mode` and `label` apply live through the handle. `defaultPlacement`
 * is compared by value, so an inline `{{ edge: "right" }}` literal is fine.
 * The remaining props (`storageKey`, `parent`, `refreshHz`, `injectStyles`,
 * `store`) remount the HUD when they change.
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
  theme,
}: PerfHudProps) {
  const source = store ?? defaultPerfMonitorStore;
  const handleRef = useRef<PerfHudHandle | null>(null);
  // The mount effect reads these through refs so changing them never remounts;
  // the live effects below keep the refs current and push changes to the handle.
  const themeRef = useRef(theme);
  const modeRef = useRef(mode);
  const labelRef = useRef(label);
  // Primitives, so an inline `{{ edge: "right" }}` literal doesn't remount each render.
  const placementEdge = defaultPlacement?.edge;
  const placementAlign = defaultPlacement?.align;

  useEffect(() => {
    const attach = (monitor: ReturnType<PerfMonitorStore["get"]>) => {
      handleRef.current?.dispose();
      handleRef.current = null;

      if (!monitor) {
        return;
      }

      handleRef.current = mountPerfHud(monitor, {
        defaultPlacement: placementEdge
          ? { align: placementAlign, edge: placementEdge }
          : undefined,
        injectStyles,
        label: labelRef.current,
        mode: modeRef.current,
        parent,
        refreshHz,
        storageKey,
        theme: themeRef.current,
      });
    };

    const unsubscribe = source.subscribe(attach);
    attach(source.get());

    return () => {
      unsubscribe();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [injectStyles, parent, placementAlign, placementEdge, refreshHz, source, storageKey]);

  useEffect(() => {
    themeRef.current = theme;
    handleRef.current?.setTheme(theme ?? "system");
  }, [theme]);

  useEffect(() => {
    modeRef.current = mode;
    handleRef.current?.setMode(mode ?? "compact");
  }, [mode]);

  useEffect(() => {
    labelRef.current = label;
    handleRef.current?.element.setAttribute("aria-label", label ?? "Performance");
  }, [label]);

  return null;
}

export { PerfHud };
export type { PerfHudProps };
