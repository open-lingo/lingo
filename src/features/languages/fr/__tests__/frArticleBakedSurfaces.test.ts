/**
 * FR article-baked-surface gate (2026-09-10) —
 * docs/fr-article-glob-race-2026-09-10.md.
 *
 * BUG: `courseAtoms.ts` / `curriculum/index.ts` populate the FR atom
 * registry via an eager `import.meta.glob` over `curriculum/m*.ts`. Vite's
 * glob-import transform unconditionally lexicographically sorts the
 * combined file list for a single call ("m10" < "m2" as strings), so eager
 * MODULE EVALUATION happened in lexicographic order (m1, m10..m19, m2,
 * m20.., m3..m9), not numeric order. `withArticle()` (grammarHelpers.ts) is
 * called at module-evaluation time by `vocabMcq`/`vocabTextMcq`; when a
 * later-numbered module evaluated before an earlier module's atoms were
 * registered, `withArticle` silently fell back to the bare noun ("café"
 * instead of "le café") and that bare text was permanently baked into the
 * later module's singleton step export for the worker's lifetime (pin F6:
 * "a noun learned bare is a noun learned wrong").
 *
 * FIX: `courseAtoms.ts` / `curriculum/index.ts` now issue three SEPARATE
 * `import.meta.glob` calls bucketed by digit-width (m[1-9], m[1-9][0-9],
 * m[1-9][0-9][0-9]) instead of one combined pattern. Each bucket is
 * internally lexicographic == numeric (same string length), and — unlike
 * merging patterns into one glob() call, which still sorts everything
 * together — separate glob() calls compile to separate blocks of hoisted
 * static imports that evaluate in source order, recovering true numeric
 * eager-evaluation order.
 *
 * THIS GATE: walks every FR module m2–m21 (imported explicitly, in numeric
 * order, the way `frSpeechMinimalPairs.test.ts` does) and every registered
 * gendered noun atom. The bug's exact shape is a LATER module referencing an
 * EARLIER module's noun — a cross-module distractor/reference — before that
 * noun's own module has registered it, so the check is scoped to exactly
 * that shape: for each gendered noun atom, EVERY module OTHER than the
 * atom's own `fromModule` that shows its bare surface as an option
 * (`multiple_choice` `.text` / `word_image_mcq` `.word`) is a violation —
 * flagged directly, per occurrence, NOT forgiven by the articled form
 * merely appearing somewhere else in the course (see the in-line comment by
 * the check for why "appears somewhere" is the wrong — and provably
 * insufficient — invariant here).
 *
 * Bare occurrences WITHIN a noun's own home module are excluded on purpose —
 * those are hand-authored, not `withArticle()`-derived, and several are
 * legitimate bare-by-design French (titles used as address terms —
 * "monsieur"/"madame" — never take articles; profession/role nouns after
 * "être" — "il est étudiant"; language names, bare after "parler" and
 * elsewhere per pin F3 — "français"/"anglais"). Confirmed by grep
 * (docs/fr-article-glob-race-2026-09-10.md): m2's "monsieur"/"étudiant" and
 * m11's "français"/"anglais" are all built from literal option objects
 * inside their OWN module, never through `vocabMcq`/`vocabTextMcq`, so they
 * cannot be race-vulnerable — the race only fires when a DIFFERENT module's
 * factory-built option references the noun before its home module has run.
 *
 * PROOF THE VERIFIER CAN FAIL: see
 * docs/fr-article-glob-race-2026-09-10.md — the ordering fix in
 * `courseAtoms.ts`/`curriculum/index.ts` was reverted once, this gate went
 * RED on exactly the known m11-references-m3 case ("chocolat"/"musique"
 * baked bare), and the fix was restored.
 */
import { describe, it, expect } from "vitest";
import type {
  LessonContent,
  MultipleChoiceStep,
  WordImageMcqStep,
} from "@/features/lesson/types";
// Import order matters here: `getRegisteredFrAtoms` from `courseAtoms.ts`
// FIRST establishes courseAtoms.ts as a plain, non-cyclic module load
// (mirrors `moduleBarGuards.ts`'s own `../courseAtoms` import, which
// `frSpeechMinimalPairs.test.ts` pulls in ahead of `withArticle` the same
// way) — importing `withArticle` (grammarHelpers.ts, which itself imports
// courseAtoms.ts) FIRST instead makes grammarHelpers.ts the entry into the
// courseAtoms/curriculum eager-glob cycle and throws a TDZ ReferenceError,
// per courseAtoms.ts's own header note on curriculum-file entry points.
import { getRegisteredFrAtoms } from "../courseAtoms";
import { withArticle } from "../grammarHelpers";

import { FR_M2_MODULE } from "../curriculum/m2";
import { FR_M3_MODULE } from "../curriculum/m3";
import { FR_M4_MODULE } from "../curriculum/m4";
import { FR_M5_MODULE } from "../curriculum/m5";
import { FR_M6_MODULE } from "../curriculum/m6";
import { FR_M7_MODULE } from "../curriculum/m7";
import { FR_M8_MODULE } from "../curriculum/m8";
import { FR_M9_MODULE } from "../curriculum/m9";
import { FR_M10_MODULE } from "../curriculum/m10";
import { FR_M11_MODULE } from "../curriculum/m11";
import { FR_M12_MODULE } from "../curriculum/m12";
import { FR_M13_MODULE } from "../curriculum/m13";
import { FR_M14_MODULE } from "../curriculum/m14";
import { FR_M15_MODULE } from "../curriculum/m15";
import { FR_M16_MODULE } from "../curriculum/m16";
import { FR_M17_MODULE } from "../curriculum/m17";
import { FR_M18_MODULE } from "../curriculum/m18";
import { FR_M19_MODULE } from "../curriculum/m19";
import { FR_M20_MODULE } from "../curriculum/m20";
import { FR_M21_MODULE } from "../curriculum/m21";
import { FR_M22_MODULE } from "../curriculum/m22";
import { FR_M23_MODULE } from "../curriculum/m23";
import { FR_M24_MODULE } from "../curriculum/m24";

// ─── Module inventory (m2–m24; add each new module at landing) ────────────

const MODULES: ReadonlyArray<{ id: string; lessons: LessonContent[] }> = [
  { id: "m2", lessons: FR_M2_MODULE.lessons },
  { id: "m3", lessons: FR_M3_MODULE.lessons },
  { id: "m4", lessons: FR_M4_MODULE.lessons },
  { id: "m5", lessons: FR_M5_MODULE.lessons },
  { id: "m6", lessons: FR_M6_MODULE.lessons },
  { id: "m7", lessons: FR_M7_MODULE.lessons },
  { id: "m8", lessons: FR_M8_MODULE.lessons },
  { id: "m9", lessons: FR_M9_MODULE.lessons },
  { id: "m10", lessons: FR_M10_MODULE.lessons },
  { id: "m11", lessons: FR_M11_MODULE.lessons },
  { id: "m12", lessons: FR_M12_MODULE.lessons },
  { id: "m13", lessons: FR_M13_MODULE.lessons },
  { id: "m14", lessons: FR_M14_MODULE.lessons },
  { id: "m15", lessons: FR_M15_MODULE.lessons },
  { id: "m16", lessons: FR_M16_MODULE.lessons },
  { id: "m17", lessons: FR_M17_MODULE.lessons },
  { id: "m18", lessons: FR_M18_MODULE.lessons },
  { id: "m19", lessons: FR_M19_MODULE.lessons },
  { id: "m20", lessons: FR_M20_MODULE.lessons },
  { id: "m21", lessons: FR_M21_MODULE.lessons },
  { id: "m22", lessons: FR_M22_MODULE.lessons },
  { id: "m23", lessons: FR_M23_MODULE.lessons },
  { id: "m24", lessons: FR_M24_MODULE.lessons },
  // EVERY new FR module lands here when it ships (coordinator checklist,
  // mirrors frSimProvenance.test.ts's / frSpeechMinimalPairs.test.ts's own
  // inventory comment).
];

/** Every option surface (`multiple_choice` `.text`, `word_image_mcq`
 *  `.word`) shown anywhere in m2–m21, mapped to the SET of module ids it was
 *  shown in — order-independent, the gate only cares whether/where a surface
 *  was EVER shown as an option. */
function collectOptionSurfacesByModule(): Map<string, Set<string>> {
  const seen = new Map<string, Set<string>>();
  const record = (surface: string, moduleId: string) => {
    let modules = seen.get(surface);
    if (!modules) {
      modules = new Set<string>();
      seen.set(surface, modules);
    }
    modules.add(moduleId);
  };
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      for (const step of lesson.steps) {
        if (step.type === "multiple_choice") {
          for (const o of (step as MultipleChoiceStep).options) {
            record(o.text, mod.id);
          }
        } else if (step.type === "word_image_mcq") {
          for (const o of (step as WordImageMcqStep).options) {
            record(o.word, mod.id);
          }
        }
      }
    }
  }
  return seen;
}

describe("fr article-baked-surface gate", () => {
  it("every gendered noun referenced bare from OUTSIDE its home module also appears with its article somewhere in the course", () => {
    const observed = collectOptionSurfacesByModule();
    const genderedNouns = getRegisteredFrAtoms().filter(
      (a) => a.partOfSpeech === "noun" && a.gender,
    );
    expect(genderedNouns.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const atom of genderedNouns) {
      const bare = atom.surface;
      const bareModules = observed.get(bare);
      if (!bareModules) continue; // never shown bare as an option — nothing to check

      // Only a bare occurrence in a module OTHER than the noun's own
      // fromModule matches the bug's shape (a later module's factory-built
      // option referencing an earlier module's noun before it registered).
      // A bare occurrence inside the noun's own home module is hand-authored
      // course content (titles, profession-attributes, language names) —
      // never `withArticle()`-derived, so never race-vulnerable.
      const crossModules = [...bareModules].filter((m) => m !== atom.fromModule);
      if (crossModules.length === 0) continue;

      // Flag every cross-module bare occurrence directly — do NOT accept
      // "the articled form shows up somewhere else in the course" as
      // exculpatory. m11's `crossModuleVocabMcq("fr-m11-6-vmcq-cinema", ...,
      // ["la musique", "le chocolat"])` hand-bakes the article as a literal
      // distractor string (a workaround the FR author added to route around
      // this exact bug) alongside OTHER m11 steps
      // (fr-m11-2-vmcq-anglais/fr-m11-5-vmcq-habiter/etc.) that build the
      // same "chocolat"/"musique" distractors through `vocabMcq`, which DOES
      // call `withArticle()` and IS race-vulnerable — under the reverted
      // (buggy) glob, those still bake bare even though "le chocolat" is
      // correctly shown elsewhere. An "appears somewhere" check would have
      // been silently satisfied by the hand-baked workaround instance and
      // missed the still-broken factory-built ones (verified empirically:
      // this is exactly what happened before this comment was written).
      // Pin F6 — "a noun learned bare is a noun learned wrong" — applies
      // per-occurrence, not course-wide.
      const articled = withArticle(bare);
      violations.push(
        `${atom.fromModule} "${bare}" is shown bare as an MCQ option in module(s) ` +
          `${crossModules.sort().join(", ")} — outside its home module ${atom.fromModule} ` +
          `— it should read "${articled}" there. Likely a glob-order article bake ` +
          `(docs/fr-article-glob-race-2026-09-10.md).`,
      );
    }
    expect(violations).toEqual([]);
  });
});
