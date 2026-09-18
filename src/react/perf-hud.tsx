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
 * published a monitor and tears it down when that sampler unmounts. `theme`
 * is the one prop that applies live; every other change remounts the HUD.
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
  // The mount effect reads the latest theme without depending on it, so a
  // theme change never remounts. Kept current by the theme effect below.
  const themeRef = useRef(theme);

  useEffect(() => {
    const attach = (monitor: ReturnType<PerfMonitorStore["get"]>) => {
      handleRef.current?.dispose();
      handleRef.current = null;

      if (!monitor) {
        return;
      }

      handleRef.current = mountPerfHud(monitor, {
        defaultPlacement,
        injectStyles,
        label,
        mode,
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
  }, [defaultPlacement, injectStyles, label, mode, parent, refreshHz, source, storageKey]);

  useEffect(() => {
    themeRef.current = theme;
    handleRef.current?.setTheme(theme ?? "system");
  }, [theme]);

  return null;
}

export { PerfHud };
export type { PerfHudProps };
