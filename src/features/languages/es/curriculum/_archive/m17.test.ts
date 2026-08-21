/**
 * ES M17 curriculum guard — the first module of the A2 tier.
 *
 * Same contract every ES module carries (pathway resolution, unique step ids,
 * passive-card follow-up spacing, no explanation on passive steps, answer-leak
 * lint, full atom-surface coverage, graded-only mastery test), plus the two
 * guards this module's payload earns:
 *
 *   - **Every preterite form the module ships agrees with `morph-es.mjs`.**
 *     m17.ts is generated, so the risk is not a typo — it is the generator
 *     drifting from the morphology it claims to derive from. The forms are
 *     re-derived here from the shipped `ES_CONJUGATION_TABLES` instead of
 *     being trusted.
 *   - **No `hablar el inglés`.** A language name after hablar/estudiar/
 *     aprender takes no article. The first generated draft shipped the article
 *     on every one of them; the fix was in the frame's inventory, and this is
 *     the ratchet that keeps it there.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M17_ATOMS, ES_M17_LESSONS } from "./m17";
import { ES_VERB_ENTRIES } from "../conjugationTables";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { ES_MODULE_ORDER } from "../grammarHelpers";

describe("ES M17 curriculum", () => {

  it("listening steps are sentence-level (m5+ ratchet)", () => {
    for (const lesson of ES_M17_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type === "listening_build") {
          expect(step.correctOrder.length, `${step.id} listening_build has < 3 tiles`).toBeGreaterThanOrEqual(3);
        }
        if (step.type === "listening_comprehension") {
          expect(
            step.transcript?.includes(" "),
            `${step.id} listening_comprehension transcript is a bare word`,
          ).toBe(true);
        }
      }
    }
  });

  it("registers 29 atoms, all fromModule m17", () => {
    expect(ES_M17_ATOMS.length).toBe(29);
    expect(ES_M17_ATOMS.every((a) => a.fromModule === "m17")).toBe(true);
  });

  it("every preterite form it registers matches the shipped conjugation table", () => {
    // The generator derives forms from scripts/draft/morph-es.mjs; the app
    // ships ES_VERB_ENTRIES. Nothing enforces that those two agree at build
    // time, so the agreement is asserted here on the forms that actually
    // reached a learner.
    // The 2026-08-18 shape of this test filtered the table down to forms that
    // were already registered and then asserted they were registered. It was
    // tautological — it could not have failed — and it also read a field
    // (`entry.infinitive`) that EsVerbEntry does not have, so the map it built
    // was keyed to `undefined` throughout. Both facts were invisible because
    // vitest does not typecheck. The direction is now reversed: the SHIPPED
    // TABLE is the authority and every m17 preterite surface is measured
    // against it, which is what catches a fabricated form like «llegé».
    const correct = new Set<string>();
    const stems = new Map<string, string>(); // stem -> lemma
    for (const entry of ES_VERB_ENTRIES) {
      for (const [cell, form] of Object.entries(entry.forms)) {
        if (cell.startsWith("preterite.")) correct.add(form as string);
      }
      stems.set(entry.lemma.slice(0, -2), entry.lemma);
    }
    // An m17 atom is CLAIMING to be a preterite of a shipped verb when it is
    // that verb's stem plus a preterite ending. A bare prefix test is not
    // enough — `estar` has the three-letter stem "est", so "estudié" (from
    // `estudiar`, which the table does not carry at all) matched it and the
    // check reported an invented form that was perfectly correct Spanish.
    // Requiring the REMAINDER to be a real ending is what makes the match a
    // claim rather than a coincidence.
    const PRETERITE_ENDINGS = [
      // -ar, including the orthographic yo forms (llegué, busqué, empecé)
      "é", "ué", "qué", "cé", "aste", "ó", "amos", "aron",
      // -er / -ir, including the vowel-stem forms (leyó, leyeron, leímos)
      "í", "iste", "ió", "yó", "imos", "ímos", "ieron", "yeron",
    ];
    const claimed = ES_M17_ATOMS.map((a) => a.surface).filter((surface) =>
      [...stems.keys()].some(
        (stem) =>
          stem.length >= 3 &&
          surface.startsWith(stem) &&
          PRETERITE_ENDINGS.includes(surface.slice(stem.length)),
      ),
    );
    expect(
      claimed.length,
      "no m17 atom shares a stem with the shipped table — the check is dead",
    ).toBeGreaterThan(0);
    for (const surface of claimed) {
      expect(
        correct.has(surface),
        `"${surface}" is not a preterite cell in ES_VERB_ENTRIES — the module invented a form`,
      ).toBe(true);
    }
  });

  it("never puts an article on a language name after hablar/estudiar/aprender", () => {
    const corpus = ES_M17_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const bad of ["el inglés", "el ingles"]) {
      expect(corpus.includes(bad), `found "${bad}" — language names take no article here`).toBe(false);
    }
  });
});

// ── Shared per-module structure lints (subsume the old hand-copied
// boilerplate this file carried until 2026-08-19) ──────────────────────────
registerEsModuleContentLints({
  moduleId: "m17",
  lessons: ES_M17_LESSONS,
  atoms: ES_M17_ATOMS,
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m17 was IR-authored against es-quality but predates this bar file; any
// debt below is measured, pinned, and SHRINK-ONLY.
registerEsModuleBarGuards({
  moduleLabel: "m17",
  lessons: ES_M17_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m17")),
  debt: { unknownTokens: 59, nonIntroDebuts: 3, translateShare: 0.28 },
});
