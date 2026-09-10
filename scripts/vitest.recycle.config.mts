/**
 * Standalone vitest config for `ja-recycle-rate.test.ts`.
 *
 * The app's own `vite.config.ts` scopes every project's `test.include` to
 * `src/**` (verified 2026-09-09: `npx vitest run scripts/foo.test.ts`
 * against the app config reports "No test files found" for anything under
 * `scripts/`). This lane is READ-ONLY on `vite.config.ts`/`package.json`,
 * so rather than touch either, `ja-recycle-rate.test.ts` gets its own tiny
 * config, scoped to this one file, with no aliases and no DOM — the file
 * under test (`ja-recycle-lib.ts`) is deliberately dependency-free.
 *
 * Run: `npx vitest run --config scripts/vitest.recycle.config.mts`
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/ja-recycle-rate.test.ts"],
    environment: "node",
  },
});
