/**
 * ENTRY-CHUNK WEIGHT GUARD.
 *
 * Rollup puts a module in the entry chunk when it is reachable from the entry
 * through STATIC imports. So a single `import { X } from "..."` where every
 * sibling uses `lazyRetry(() => import("..."))` can silently drag a large data
 * module into the bundle every visitor downloads — including the logged-out
 * landing page.
 *
 * That is exactly what happened (2026-08-01): `App.tsx` imported
 * `FlashcardsPage`, `PracticePage` and `ProtectedHome` statically, and each
 * reached `data/courseDeck` -> `frequencyResolver` -> `ko/frequencyAtoms`
 * (~494 KB, 2999 atoms). Confirmed present in `dist/assets/index-*.js`, for a
 * feature (`settings.flashcards.frequencyVocab`) that defaults to false.
 *
 * This walks the static import graph from `main.tsx` — no build required — and
 * fails if any heavy data module becomes statically reachable again. It is a
 * cheap guard for a fix that is otherwise one careless import away from
 * regressing, and it names the offending path so the fix is obvious.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(SRC, "main.tsx");

/**
 * Modules that must stay OUT of the entry chunk, with why. Paths are
 * src-relative. Add to this list rather than raising a byte budget — the point
 * is which module got pulled in, not the total.
 */
const MUST_NOT_BE_EAGER: Array<{ file: string; why: string }> = [
  {
    file: "features/languages/ko/frequencyAtoms.ts",
    why: "~494 KB Korean frequency registry; opt-in feature, defaults off",
  },
];

function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // bare package — node_modules, not our concern here
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/**
 * Static import specifiers only. `import type` is erased at build time and
 * `import(...)` is the boundary Rollup splits on — neither pulls a module into
 * the entry chunk, so neither is followed here.
 */
function staticImports(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const withClause = /^[ \t]*import\s+(?!type\s)([\s\S]*?)from\s*["']([^"']+)["']/gm;
  while ((m = withClause.exec(src))) out.push(m[2]);
  const sideEffect = /^[ \t]*import\s*["']([^"']+)["']/gm;
  while ((m = sideEffect.exec(src))) out.push(m[1]);
  return out;
}

/** BFS from the entry; returns the import chain to `target`, or null. */
function pathToModule(target: string): string[] | null {
  const parent = new Map<string, string | null>([[ENTRY, null]]);
  const queue = [ENTRY];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const spec of staticImports(cur)) {
      const resolved = resolveImport(spec, cur);
      if (!resolved || parent.has(resolved)) continue;
      parent.set(resolved, cur);
      if (resolved === target) {
        const chain: string[] = [];
        for (let n: string | null = resolved; n; n = parent.get(n) ?? null) {
          chain.push(path.relative(SRC, n));
        }
        return chain.reverse();
      }
      queue.push(resolved);
    }
  }
  return null;
}

describe("entry chunk weight", () => {
  it("the graph walker actually works (positive control)", () => {
    // App.tsx is statically imported by main.tsx — if this stops resolving,
    // every assertion below would pass vacuously.
    const chain = pathToModule(path.join(SRC, "App.tsx"));
    expect(chain).not.toBeNull();
    expect(chain![0]).toBe("main.tsx");
  });

  it.each(MUST_NOT_BE_EAGER)(
    "$file is not statically reachable from the entry",
    ({ file, why }) => {
      const target = path.join(SRC, file);
      expect(fs.existsSync(target), `${file} moved or was renamed`).toBe(true);

      const chain = pathToModule(target);
      const rendered = chain
        ? chain.map((f, i) => `  ${i}. ${f}`).join("\n")
        : "";

      expect(
        chain,
        `${file} is in the entry chunk (${why}).\n` +
          "Every visitor now downloads and parses it on first paint.\n" +
          "Break the chain below — usually by making the route lazy " +
          "(lazyRetry(() => import(...))) like its siblings:\n\n" +
          rendered,
      ).toBeNull();
    },
  );
});
