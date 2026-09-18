/**
 * Dark, light, or follow the OS. One instance per HUD: the floating host and
 * the card inside it both paint `resolved` onto `data-theme`, and the
 * stylesheet picks the palette from that attribute. `system` tracks
 * `prefers-color-scheme` for as long as the instance lives.
 */
type ThemeMode = "dark" | "light" | "system";
type ResolvedTheme = Exclude<ThemeMode, "system">;

const THEME_MODES: readonly ThemeMode[] = ["dark", "light", "system"];
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);

class HudTheme {
  private current: ThemeMode;
  private readonly listeners = new Set<() => void>();
  private media: MediaQueryList | null = null;
  private readonly onSchemeChange = () => this.notify();

  constructor(mode: ThemeMode = "system") {
    this.current = mode;
    this.watch();
  }

  /** What the host asked for. */
  get mode(): ThemeMode {
    return this.current;
  }

  /**
   * `dark` or `light`, with `system` resolved against the OS preference.
   * Where `matchMedia` is missing, `system` falls back to `dark`, the HUD's
   * original palette.
   */
  get resolved(): ResolvedTheme {
    if (this.current !== "system") {
      return this.current;
    }

    if (!this.media) {
      return "dark";
    }

    return this.media.matches ? "dark" : "light";
  }

  setMode(mode: ThemeMode) {
    if (mode === this.current) {
      return;
    }

    this.current = mode;
    this.watch();
    this.notify();
  }

  /** Fires on `setMode` and, in `system`, whenever the OS preference flips. */
  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Stop tracking the OS preference and drop every subscriber. */
  dispose() {
    this.unwatch();
    this.listeners.clear();
  }

  private watch() {
    if (this.current !== "system") {
      this.unwatch();

      return;
    }

    if (this.media || typeof matchMedia !== "function") {
      return;
    }

    this.media = matchMedia(DARK_SCHEME_QUERY);
    this.media.addEventListener("change", this.onSchemeChange);
  }

  private unwatch() {
    this.media?.removeEventListener("change", this.onSchemeChange);
    this.media = null;
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** Paint the resolved theme onto an element for the stylesheet to key off. */
const applyTheme = (element: HTMLElement, theme: HudTheme) => {
  element.dataset.theme = theme.resolved;
};

export { applyTheme, HudTheme, isThemeMode, THEME_MODES };
export type { ResolvedTheme, ThemeMode };
