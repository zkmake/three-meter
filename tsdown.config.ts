import { defineConfig } from "tsdown";

import { PERF_HUD_STYLES } from "./src/ui/styles.ts";

/**
 * Library build. Three ESM entries with declarations; `exports` is generated
 * into package.json on every build so it can't drift from the entries. The
 * `development` condition keeps pointing at `src/`, which is what the monorepo
 * (Vite dev, vitest, tsc via `customConditions`) resolves, so no build is needed to
 * consume the package here. Everything else, and the published tarball, gets
 * `dist/`. `styles.css` is emitted from the same string the runtime injects,
 * for hosts that would rather link a file. publint and arethetypeswrong run
 * after each build.
 *
 * Not in tsconfig `include`: tsdown types reach into `@arethetypeswrong/core`,
 * which ships `.ts` sources that fail this repo's strictness. tsdown validates
 * the config itself when it runs.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    ui: "src/ui/index.ts",
    react: "src/react/index.ts",
  },
  format: "esm",
  platform: "browser",
  target: "baseline-widely-available",
  dts: true,
  sourcemap: true,
  clean: true,
  exports: {
    devExports: "development",
    customExports: {
      "./styles.css": "./dist/styles.css",
    },
  },
  publint: true,
  // A CSS export has no types to resolve; attw would flag it on every build.
  attw: { excludeEntrypoints: ["./styles.css"], profile: "esm-only" },
  plugins: [
    {
      name: "three-meter:emit-styles",
      generateBundle() {
        this.emitFile({
          fileName: "styles.css",
          source: `${PERF_HUD_STYLES.trim()}\n`,
          type: "asset",
        });
      },
    },
  ],
});
