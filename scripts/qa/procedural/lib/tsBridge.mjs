/**
 * A tiny in-process bridge that lets a plain Node script import repo TS
 * modules under `src/` WITHOUT a new dependency and WITHOUT duplicating
 * their logic.
 *
 * Why this exists: the procedural-QA runner and its checks must reuse
 * existing gates (`src/features/practice/content/gate.ts`'s `gateResidual`
 * / `isComprehensible`, `getNormalizedCourseAtoms`, `stepTaxonomy.ts`'s
 * `jaSurfaces` / `SELECTION_TYPES`) rather than reinvent them (the lane
 * brief's explicit instruction). Node cannot `import` a `.ts` file with
 * path aliases (`@/...`) on its own, and this repo intentionally has no
 * ts-node/tsx dependency. `vite` IS already a devDependency and its
 * programmatic `createServer(...).ssrLoadModule(...)` API is the same
 * machinery `vite-node`/`vitest` build on: it transpiles TS, resolves the
 * `@` alias, and runs the module in this Node process. One server is
 * created lazily and reused for the life of the CLI process; call
 * `closeTsBridge()` when done (the CLI's `run.mjs` does this in a
 * `finally`).
 *
 * Read-only usage: every module loaded through this bridge lives under
 * `src/features/**`, which this lane does not modify — it only reads the
 * exported functions/constants.
 */
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);

let serverPromise;

function getServer() {
  if (!serverPromise) {
    serverPromise = createServer({
      configFile: false,
      root: REPO_ROOT,
      logLevel: "error",
      resolve: {
        alias: { "@": path.join(REPO_ROOT, "src") },
      },
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, hmr: false, watch: null },
    });
  }
  return serverPromise;
}

const moduleCache = new Map();

/**
 * Load a repo TS module by its path relative to the repo root (e.g.
 * `/src/features/practice/content/gate.ts`), memoized for the life of the
 * process. Returns the module's exports object.
 */
export async function loadTs(relPath) {
  if (moduleCache.has(relPath)) return moduleCache.get(relPath);
  const server = await getServer();
  const mod = await server.ssrLoadModule(relPath);
  moduleCache.set(relPath, mod);
  return mod;
}

export async function closeTsBridge() {
  if (!serverPromise) return;
  const server = await serverPromise;
  serverPromise = undefined;
  moduleCache.clear();
  await server.close();
}
