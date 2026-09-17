/**
 * Which metrics the compact HUD shows, plus the dim-on-leave toggle. One instance per
 * HUD; the full-mode checkboxes and the compact card stay in sync through it.
 * Persists to `localStorage` under `storageKey` (pass `null` to keep it in
 * memory only).
 */
import type { TimingMetric } from "../core/types.ts";

type HudSelection = {
  dim: boolean;
  graphs: ReadonlySet<TimingMetric>;
  numbers: ReadonlySet<string>;
};

type HudDefaults = {
  dim?: boolean;
  graphs?: readonly TimingMetric[];
  numbers?: readonly string[];
};

type HudSettingsOptions = {
  /** localStorage key. Default `three-meter`; `null` disables persistence. */
  storageKey?: string | null;
  /** What a first visit shows. */
  defaults?: HudDefaults;
};

type MutableSelection = {
  dim: boolean;
  graphs: Set<TimingMetric>;
  numbers: Set<string>;
};

const DEFAULT_STORAGE_KEY = "three-meter";
const DEFAULT_DIM = false;
const DEFAULT_NUMBERS: readonly string[] = ["fps", "calls", "cpu", "gpu"];
const DEFAULT_GRAPHS: readonly TimingMetric[] = [];
const TIMING_METRICS = new Set<TimingMetric>(["fps", "cpu", "gpu"]);

const isTimingMetric = (value: string): value is TimingMetric =>
  TIMING_METRICS.has(value as TimingMetric);

class HudSettings {
  private readonly storageKey: string | null;
  private readonly defaults: Required<HudDefaults>;
  private readonly listeners = new Set<() => void>();
  private readonly state: MutableSelection;

  constructor(options: HudSettingsOptions = {}) {
    this.storageKey = options.storageKey === undefined ? DEFAULT_STORAGE_KEY : options.storageKey;
    this.defaults = {
      dim: options.defaults?.dim ?? DEFAULT_DIM,
      graphs: options.defaults?.graphs ?? DEFAULT_GRAPHS,
      numbers: options.defaults?.numbers ?? DEFAULT_NUMBERS,
    };
    this.state = this.load();
  }

  get selection(): HudSelection {
    return this.state;
  }

  get dim() {
    return this.state.dim;
  }

  setDim(enabled: boolean) {
    this.state.dim = enabled;
    this.persistAndNotify();
  }

  isNumberEnabled(key: string) {
    return this.state.numbers.has(key);
  }

  isGraphEnabled(metric: TimingMetric) {
    return this.state.graphs.has(metric);
  }

  setNumberEnabled(key: string, enabled: boolean) {
    if (enabled) {
      this.state.numbers.add(key);
    } else {
      this.state.numbers.delete(key);
    }

    this.persistAndNotify();
  }

  setGraphEnabled(metric: TimingMetric, enabled: boolean) {
    if (enabled) {
      this.state.graphs.add(metric);
    } else {
      this.state.graphs.delete(metric);
    }

    this.persistAndNotify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private load(): MutableSelection {
    const fallback = (): MutableSelection => ({
      dim: this.defaults.dim,
      graphs: new Set(this.defaults.graphs),
      numbers: new Set(this.defaults.numbers),
    });

    if (this.storageKey === null) {
      return fallback();
    }

    try {
      const raw = localStorage.getItem(this.storageKey);

      if (!raw) {
        return fallback();
      }

      const parsed = JSON.parse(raw) as { dim?: boolean; graphs?: string[]; numbers?: string[] };

      return {
        dim: parsed.dim ?? this.defaults.dim,
        graphs: new Set((parsed.graphs ?? this.defaults.graphs).filter(isTimingMetric)),
        numbers: new Set(parsed.numbers ?? this.defaults.numbers),
      };
    } catch {
      // Malformed or unavailable storage → defaults.
      return fallback();
    }
  }

  private persistAndNotify() {
    if (this.storageKey !== null) {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({
            dim: this.state.dim,
            graphs: [...this.state.graphs],
            numbers: [...this.state.numbers],
          }),
        );
      } catch {
        // In-memory selection still drives the live views.
      }
    }

    for (const listener of this.listeners) {
      listener();
    }
  }
}

export { DEFAULT_STORAGE_KEY, HudSettings };
export type { HudDefaults, HudSelection, HudSettingsOptions };
