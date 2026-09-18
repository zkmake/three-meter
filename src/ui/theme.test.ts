import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { HudTheme, isThemeMode } from "./theme.ts";

type Listener = (event: { matches: boolean }) => void;

/** A `matchMedia` stub whose `prefers-color-scheme: dark` answer can be flipped. */
const fakeMatchMedia = (initiallyDark: boolean) => {
  const listeners = new Set<Listener>();
  const query = {
    matches: initiallyDark,
    addEventListener: (_type: string, listener: Listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: Listener) => {
      listeners.delete(listener);
    },
  };

  return {
    matchMedia: vi.fn(() => query),
    setDark: (dark: boolean) => {
      query.matches = dark;

      for (const listener of listeners) {
        listener({ matches: dark });
      }
    },
    listenerCount: () => listeners.size,
  };
};

describe("HudTheme", () => {
  let media: ReturnType<typeof fakeMatchMedia>;

  beforeEach(() => {
    media = fakeMatchMedia(true);
    vi.stubGlobal("matchMedia", media.matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("defaults to system and resolves against the OS preference", () => {
    const theme = new HudTheme();
    expect(theme.mode).toBe("system");
    expect(theme.resolved).toBe("dark");

    media.setDark(false);
    expect(theme.resolved).toBe("light");
  });

  test("explicit modes ignore the OS and stop listening to it", () => {
    const theme = new HudTheme("light");
    expect(theme.resolved).toBe("light");
    expect(media.matchMedia).not.toHaveBeenCalled();

    theme.setMode("system");
    expect(media.listenerCount()).toBe(1);

    theme.setMode("dark");
    expect(media.listenerCount()).toBe(0);
    media.setDark(false);
    expect(theme.resolved).toBe("dark");
  });

  test("notifies on setMode and on OS changes while in system", () => {
    const theme = new HudTheme("system");
    const listener = vi.fn();
    const unsubscribe = theme.subscribe(listener);

    media.setDark(false);
    expect(listener).toHaveBeenCalledTimes(1);

    theme.setMode("light");
    expect(listener).toHaveBeenCalledTimes(2);

    // Same mode again is a no-op.
    theme.setMode("light");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    theme.setMode("dark");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("dispose releases the media listener", () => {
    const theme = new HudTheme("system");
    expect(media.listenerCount()).toBe(1);

    theme.dispose();
    expect(media.listenerCount()).toBe(0);
  });

  test("system falls back to dark without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(new HudTheme("system").resolved).toBe("dark");
  });

  test("isThemeMode guards stored strings", () => {
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("sepia")).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });
});
