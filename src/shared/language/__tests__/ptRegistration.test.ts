/**
 * PT registration pin (docs/pt-course-design-2026-09-18.md §5, infra
 * scaffolding lane). `moduleConformance.test.ts` already gates every
 * `describe.each(getAllLanguageIds())` contract check generically — this
 * file pins the two PT-specific claims that test doesn't make: PT is
 * registered (so `moduleConformance` actually covers it, not vacuously),
 * and PT stays OUT of the learner-facing language switch, matching the
 * "registered but not selectable" precedent FR set before its audio gate
 * passed.
 *
 * ATOMS INVARIANT (lane PTINT, 2026-09-18): m1's five lesson fragments
 * (`courseAtoms.m1-l1..l5.ts`) register their atoms as a side effect of
 * `courseAtoms.ts` importing them, independent of whether
 * `curriculum/m1.ts` has been (re)compiled from the IR — see that file's
 * own header. So `m.courseAtoms` is no longer `[]` even though `m.curriculum`
 * still is (below). The old blanket `toEqual([])` pin is replaced with the
 * real per-atom invariant every SRS/flashcard/gate consumer relies on:
 * every atom has a surface + gloss, and every noun atom carries `gender`
 * (PT agreement engines need it) — except a small, explicitly documented
 * exemption list for genuinely epicene surfaces (see the exemption's own
 * comment). PT's `PtAtom` type has no separate `imageable` boolean (unlike
 * JA) — "imageable" is expressed by an `emoji` field's presence, which this
 * test does not blanket-require (many verbs/particles are legitimately
 * non-pictureable) — see `courseAtoms.m1-l5.ts`'s header for the same
 * reasoning. Count floor (>=40) is design doc §5's "~34 new content atoms"
 * estimate rounded down with headroom; today's live count is 42.
 */
import { describe, it, expect } from "vitest";
import {
  getAllLanguageIds,
  getLanguageModule,
  isLanguageRegistered,
} from "@/shared/language/registry";
import { AVAILABLE_LEARNING_LANGUAGE_IDS, getLanguageConfig } from "@/shared/domain/languageConfig";
// PT-native accessor: `getLanguageModule("pt").courseAtoms` is narrowed to
// the cross-language base `Atom` shape by `pt/module.ts` ("PtAtom already
// satisfies Atom — narrow the type"), which drops `gender` entirely (the
// base `Atom` interface has no gender field at all — that's a PT/KO-only
// extension). The gender invariant below has to read the PT-specific
// registry directly to see it.
import { getPtCourseAtoms } from "@/features/languages/pt/courseAtoms";

// Nouns whose Portuguese surface is genuinely epicene (same form for both
// grammatical genders — "o estudante" / "a estudante") so `gender` is
// deliberately left unset rather than guessed. See
// `courseAtoms.m1-l1.ts`'s header for "estudante"'s own rationale.
const GENDER_EXEMPT_NOUN_SURFACES = new Set(["estudante"]);

describe("pt registration — registered but not selectable", () => {
  it("is registered", () => {
    expect(isLanguageRegistered("pt")).toBe(true);
    expect(getAllLanguageIds()).toContain("pt");
  });

  it("resolves a module (curriculum still empty — m1.ts is not yet compiled)", () => {
    const m = getLanguageModule("pt");
    expect(m.id).toBe("pt");
    // BLOCKED, not yet re-pinned to 5 lessons: `node scripts/compile-ir-pt.mjs
    // m1` currently fails its own "last lesson must end on sim" check (§13.9
    // law 7) against L5 as authored, because L5 is a REGULAR lesson (design
    // doc §4 row L5's own closing sequence: sim -> matchLit -> speakLit-win)
    // — m1 is only 5 of an assumed 8-10 lesson module (design doc §5), so
    // the true zero-new/mastery-closing lesson doesn't exist yet. See the
    // PTINT lane report for the full finding. Resolved 2026-09-18 evening:
    // the L6 checkpoint lesson (zero new atoms, sim last) landed and m1 now
    // compiles to 6 lessons — the registered curriculum carries exactly them.
    expect(m.curriculum.length, "pt m1 compiles to one module").toBe(1);
    expect(m.curriculum[0]?.lessons?.length ?? 0, "m1 = L1–L5 + the L6 checkpoint").toBe(6);
    expect(m.placementBank).toEqual({ screener: [], byModule: {} });
  });

  it("has >=40 registered atoms, every one with surface + gloss", () => {
    const m = getLanguageModule("pt");
    expect(m.courseAtoms.length).toBeGreaterThanOrEqual(40);
    for (const a of m.courseAtoms) {
      expect(a.surface, `atom ${a.id} has no surface`).toBeTruthy();
      expect(a.gloss, `atom ${a.surface} has no gloss`).toBeTruthy();
    }
  });

  it("every noun atom carries a grammatical gender (agreement engines need it), except documented epicene surfaces", () => {
    const nouns = getPtCourseAtoms().filter((a) => a.partOfSpeech === "noun");
    expect(nouns.length).toBeGreaterThan(0);
    for (const n of nouns) {
      if (GENDER_EXEMPT_NOUN_SURFACES.has(n.surface)) continue;
      expect(n.gender, `noun atom "${n.surface}" has no gender set`).toMatch(/^[mf]$/);
    }
  });

  it("has a display config (Switch-language would render it correctly IF ever shown)", () => {
    const cfg = getLanguageConfig("pt");
    expect(cfg?.name).toBe("Portuguese");
    expect(cfg?.flag).toBe("🇧🇷");
  });

  it("does NOT appear in the learner-facing language switch by default", () => {
    expect(AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).not.toContain("pt");
  });
});
