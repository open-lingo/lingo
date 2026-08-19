/**
 * Every learner-facing surface that renders a step must render it inside
 * `LessonStepEnvironment`.
 *
 * This is a source lint, not a behaviour test, because the failure mode is
 * an ABSENCE: a page that forgets a provider renders fine, passes every
 * render test, and quietly serves the wrong script ladder. It has now
 * happened three times (test-out, grammar review, alphabet practice), each
 * found by eye rather than by CI, which is what a lint is for.
 *
 * What goes wrong without it — both halves are silent:
 *   - no `LessonModuleContext` → the romaji ladder falls back to the
 *     `hiraganaRomajiAutoOff` flag, which only flips when an M7+ lesson is
 *     COMPLETED, so romaji leaks over post-cutoff content;
 *   - no symbol-mastery provider → `useSymbolMastery` returns a NOOP whose
 *     `registerExposure`/`recordCorrect` do nothing and whose
 *     `isHelperHidden` is always false: helpers never fade and exposures
 *     never count.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..", "..", "..");

/**
 * Surfaces allowed to render a step bare. Each needs a written reason —
 * "it's only a dev page" is one, but it has to be said out loud.
 */
const EXEMPT = new Map<string, string>([
  [
    "features/preview/PreviewLessonPage.tsx",
    "Pre-signup first taste. Its own content shape (PreviewLesson) carries no " +
      "module identity, and romaji is wanted there — the ladder does not apply.",
  ],
  [
    "features/admin/lessons/editor/PreviewPane.tsx",
    "Admin authoring preview. Shows the step as authored, deliberately " +
      "un-gated by any one learner's position or mastery.",
  ],
]);

/** Dev/QA drivers under `dev/` are not learner-facing. */
const isDevSurface = (rel: string) => rel.includes("/dev/");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "__tests__") continue;
      walk(full, acc);
    } else if (name.endsWith(".tsx") && !name.includes(".test.")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("step environment coverage", () => {
  const files = walk(join(SRC, "features"))
    .map((full) => ({
      rel: full.slice(SRC.length + 1).replace(/\\/g, "/"),
      text: readFileSync(full, "utf8"),
    }))
    .filter((f) => f.text.includes("<StepRenderer"));

  it("instrument control: the scan finds the known step surfaces", () => {
    // Fails loudly if the walk breaks or StepRenderer is renamed, instead of
    // passing vacuously over an empty list.
    expect(files.length).toBeGreaterThanOrEqual(5);
    expect(files.map((f) => f.rel)).toContain("features/lesson/LessonPage.tsx");
  });

  it("every learner-facing step surface mounts LessonStepEnvironment", () => {
    const missing = files
      .filter((f) => !isDevSurface(f.rel))
      .filter((f) => !EXEMPT.has(f.rel))
      .filter((f) => !f.text.includes("<LessonStepEnvironment"))
      .map((f) => f.rel);
    expect(
      missing,
      "These render a lesson step without the script-ladder providers. Wrap " +
        "the StepRenderer in <LessonStepEnvironment moduleIndex={…}>, or add " +
        "the file to EXEMPT with a reason.",
    ).toEqual([]);
  });

  it("no stale exemptions", () => {
    const seen = new Set(files.map((f) => f.rel));
    const stale = [...EXEMPT.keys()].filter((rel) => !seen.has(rel));
    expect(stale, "exempted files that no longer render a step").toEqual([]);
  });
});
