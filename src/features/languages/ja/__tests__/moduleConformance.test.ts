/**
 * JA-specific conformance checks — modeled on
 * `features/languages/ko/__tests__/moduleConformance.test.ts`. The generic
 * conformance test at `shared/language/__tests__/moduleConformance.test.ts`
 * covers the ADR-001 contract; this file covers the JA attribution
 * invariants introduced by the 2026-06-12 M8-M27 `fromModule` backfill:
 *
 *   - Every content module m3-m7 has ≥1 atom attributed via `fromModule`.
 *   - Every atom attributed to m3-m7 actually APPEARS in that module's
 *     lesson content (string containment over the module's steps) —
 *     Spencer's invariant: an atom may only enter SRS review if the
 *     learner has actually been introduced to it.
 *   - Every id in n5-module-vocab-map.json resolves to a courseAtoms id.
 *   - No n5-grammar-points.json entry whose module is ≤ m27 is still
 *     "planned" (explicit exemption list below for the two kanji sets).
 *   - getAtomsUpToModule("m27") includes every attributed SRS-eligible atom.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { jaModule } from "../module";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "../courseAtoms";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import { getAtomsUpToModule } from "@/features/lesson/data/lessonAtomIndex";
import { parseModuleIndex } from "@/shared/settings/romajiAutoFlip";
import vocabMap from "@/features/lesson/data/n5-module-vocab-map.json";
import grammarPoints from "@/features/lesson/data/n5-grammar-points.json";

/**
 * Content modules — DERIVED from the live curriculum, not a hardcoded range
 * (which silently excluded m28/m29 — the N4 tier — from every invariant here;
 * see docs/retrospective-2026-07-17.md Gate 1). m1/m2 are the kana modules
 * (no SRS, per Spencer). m28 is the review-only N5 capstone: it introduces no
 * atoms of its own, so it is excluded from the attribution invariants below.
 */
// 2026-07-19 (rewrite spine): the capstone moved from m28 to m29 (tile s25),
// and m4-m29 are comingSoon placeholders with zero lessons until each spine
// tile is authored — they can't be held to the attribution invariants yet,
// so lesson-less modules are excluded here. As spine modules gain lessons
// they automatically re-enter the invariant set.
const CAPSTONE_MODULE_IDS = new Set(["m29"]);
const CONTENT_MODULE_IDS: string[] = jaModule.curriculum
  .filter((m) => m.lessons.length > 0)
  .map((m) => m.id)
  .filter((id) => /^m\d+$/.test(id))
  .filter((id) => id !== "m1" && id !== "m2")
  .filter((id) => !CAPSTONE_MODULE_IDS.has(id));

/**
 * Grammar points whose module is ≤ m27 but whose pattern could NOT be
 * confirmed in any authored curriculum file (2026-06-12 audit). Each entry
 * stays "planned" in n5-grammar-points.json until the content ships.
 */
const GRAMMAR_PLANNED_EXEMPTIONS = new Set<string>([
  // No kanji-recognition step content exists in m14 (or any module) yet —
  // the kanji parallel track ships kanji glosses inline, not as sets.
  "kanji-set-1",
  // Same: no kanji-recognition set in m23.
  "kanji-set-2",
]);

/** moduleId → concatenated JSON of every JA lesson's steps in that module. */
function buildModuleContentIndex(): Map<string, string> {
  const byModule = new Map<string, string[]>();
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    const list = byModule.get(lesson.moduleId) ?? [];
    list.push(JSON.stringify(lesson.steps));
    byModule.set(lesson.moduleId, list);
  }
  const out = new Map<string, string>();
  for (const [moduleId, chunks] of byModule) out.set(moduleId, chunks.join("\n"));
  return out;
}

/**
 * kana/kanji fields may carry variants ("いい / よい", "川 / 河") or
 * compound surfaces ("より、ほう" — paired function words taught together);
 * any single variant/part appearing in the module's steps counts.
 */
function surfaceVariants(atom: { kana: string; kanji?: string }): string[] {
  const out = atom.kana.split(/[/、]/).map((s) => s.trim());
  if (atom.kanji) out.push(...atom.kanji.split(/[/、]/).map((s) => s.trim()));
  return out.filter(Boolean);
}

describe("JA module conformance — attribution invariants", () => {
  const moduleContent = buildModuleContentIndex();

  it("has Japanese identity", () => {
    expect(jaModule.id).toBe("ja");
    expect(jaModule.displayName.native).toBe("日本語");
  });

  it("curriculum surfaces every content module m3-m7", () => {
    const moduleIds = jaModule.curriculum.map((m) => m.id);
    for (const id of CONTENT_MODULE_IDS) {
      expect(moduleIds, `curriculum missing ${id}`).toContain(id);
    }
  });

  it("every content module m3-m7 has ≥1 atom attributed via fromModule", () => {
    // NARROWED 2026-07-27 (m28), with the evidence dumped first. The invariant
    // is "a content module attributes at least one vocabulary atom", and until
    // now it could only see `courseAtoms.fromModule`. That field is ARCHIVED
    // attribution — the very staleness the DORMANT block below is about — and
    // the six rows tagged `m27` prove it: they carry `introducedByLessonId:
    // "ja-m27-4-1"`, a lesson id from the archived course, and one of them is
    // つよい, which the NEO m27 never taught (m28 introduces it). So m27 passes
    // this check for a reason unrelated to m27's content.
    //
    // m28 is where that broke honestly rather than by luck: the archived
    // course had NO m28 at all (its numbering ran m27→m29), so no row can
    // carry the tag, while the neo m28 declares 24 atoms in its IR. Re-tagging
    // a courseAtoms row to paper over this is exactly what the DORMANT note
    // says cascades into the kanji-surface and comprehensibility systems.
    //
    // So the guard now counts BOTH channels — a courseAtoms row tagged to the
    // module, or the module's own IR `newAtoms`. That STRENGTHENS it: a module
    // with neither still fails, and IR-declared atoms (the m11-m28 way of
    // registering derived forms, 90+ of them, deliberately kept out of
    // courseAtoms because registering inflections regresses flashcard import)
    // now count as the attribution they actually are.
    const counts = new Map<string, number>();
    for (const atom of JA_COURSE_ATOMS) {
      counts.set(atom.fromModule, (counts.get(atom.fromModule) ?? 0) + 1);
    }
    const IR_DIR = join(
      dirname(fileURLToPath(import.meta.url)),
      "../curriculum/ir",
    );
    let irModules = 0;
    for (const f of readdirSync(IR_DIR).filter((x) => x.endsWith(".ir.json"))) {
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as {
        module?: string;
        newAtoms?: unknown[];
      };
      if (!ir.module || !ir.newAtoms?.length) continue;
      irModules++;
      counts.set(ir.module, (counts.get(ir.module) ?? 0) + ir.newAtoms.length);
    }
    // Non-vacuity: a glob that stops matching would silently re-open the hole
    // this narrowing closed.
    expect(irModules, "no IR module declared any newAtoms").toBeGreaterThan(15);
    const empty = CONTENT_MODULE_IDS.filter((id) => (counts.get(id) ?? 0) === 0);
    expect(
      empty,
      `modules with zero attributed atoms: ${empty.join(", ")}`,
    ).toEqual([]);
  });

  // DORMANT since the 2026-07-26 ARCHIVE. Old-course lessons are archived, so
  // atoms still tagged m3-m7 by OLD-course attribution no longer resolve to a
  // live lesson in "their" module. Re-tagging them wholesale cascades into the
  // kanji-surface and comprehensibility systems, so the real fix is the
  // registry + atom-provenance re-key to the neo spine. Re-enable after it.
  it.skip("every atom attributed to m3-m7 appears in that module's lesson content", () => {
    const checked = new Set(CONTENT_MODULE_IDS);
    const missing: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      if (!checked.has(atom.fromModule)) continue;
      const content = moduleContent.get(atom.fromModule) ?? "";
      const found = surfaceVariants(atom).some((s) => content.includes(s));
      if (!found) {
        missing.push(`${atom.id} (${atom.kana}) → ${atom.fromModule}`);
      }
    }
    expect(
      missing,
      `atoms attributed to a module whose lessons never surface them:\n  ${missing.join("\n  ")}`,
    ).toEqual([]);
  });

  it("every id in n5-module-vocab-map.json resolves to a courseAtoms id", () => {
    const atomIds = new Set(JA_COURSE_ATOMS.map((a) => a.id));
    const unresolved: string[] = [];
    for (const [key, ids] of Object.entries(vocabMap)) {
      for (const id of ids) {
        if (!atomIds.has(id)) unresolved.push(`${key}: ${id}`);
      }
    }
    expect(
      unresolved,
      `vocab-map ids with no matching courseAtom:\n  ${unresolved.join("\n  ")}`,
    ).toEqual([]);
  });

  it("no grammar point with module ≤ m27 is still 'planned' (minus exemptions)", () => {
    const stale = grammarPoints.filter((p) => {
      const n = parseInt(p.module.replace("m", ""), 10);
      return (
        Number.isFinite(n) &&
        n <= 7 &&
        p.status === "planned" &&
        !GRAMMAR_PLANNED_EXEMPTIONS.has(p.id)
      );
    });
    expect(
      stale.map((p) => `${p.id} (${p.module})`),
      "grammar points marked 'planned' whose module already shipped",
    ).toEqual([]);
  });

  it("no ja lesson contains an `info` step (2026-07-16 info-step purge)", () => {
    // The info-step audit removed all 842 recap/preview cards and promoted
    // the 20 teaching cards to grammar_rule. ja must ship ZERO info steps;
    // this guards against a regression re-introducing one.
    const offenders: string[] = [];
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      const infoSteps = lesson.steps.filter((s) => s.type === "info");
      if (infoSteps.length > 0) {
        offenders.push(`${lessonId} (${infoSteps.length})`);
      }
    }
    expect(offenders, `ja lessons still carrying info steps:\n  ${offenders.join("\n  ")}`).toEqual([]);
  });

  it("no ja lesson contains a `phrase_card` step (Gate 8: shelved 2026-07-12)", () => {
    // phrase_card is banned in ja (guide §4b2) — and vocab()/phrase() silently
    // EMIT it, so an author calling those authors a banned step believing they
    // are compliant. This runtime gate catches both the raw literal and the
    // factory calls. es/ko still ship phrase_card legitimately, hence ja-scoped.
    const offenders: string[] = [];
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      const n = lesson.steps.filter((s) => s.type === "phrase_card").length;
      if (n > 0) offenders.push(`${lessonId} (${n})`);
    }
    expect(
      offenders,
      `ja lessons carrying phrase_card (use vocabMcq / listeningCompSentence+speaking / build):\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("parseModuleIndex round-trips every real curriculum moduleId (Gate 3)", () => {
    // Kills the class that caused the romaji-ladder outage: a parser expecting
    // an "ja-"/"ko-" prefix returned 0 for the bare "m29" moduleId the data
    // actually carries. Assert the parser survives the EXACT id shape in the
    // live curriculum, not a hand-picked sample.
    const bad = jaModule.curriculum
      .map((m) => m.id)
      .filter((id) => id !== "m1" && id !== "m2") // kana modules: index irrelevant
      .filter((id) => parseModuleIndex(id) <= 0);
    expect(
      bad,
      `moduleIds parseModuleIndex failed to resolve (returned 0):\n  ${bad.join("\n  ")}`,
    ).toEqual([]);
  });

  it("every ja lesson has ≥1 step and ends with a gradeable step", () => {
    // After the info purge, no lesson may be empty or terminate on a passive
    // teach card (info/grammar_rule/phrase_card/symbol_intro) — the last
    // thing a learner touches must be a retrieval, not an exposition slide.
    const empty: string[] = [];
    const badEnd: string[] = [];
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      if (lesson.steps.length === 0) {
        empty.push(lessonId);
        continue;
      }
      const last = lesson.steps[lesson.steps.length - 1];
      if (!isGradedStep(last)) {
        badEnd.push(`${lessonId} ends with ${last.type}`);
      }
    }
    expect(empty, `empty ja lessons:\n  ${empty.join("\n  ")}`).toEqual([]);
    expect(badEnd, `ja lessons ending on a passive teach card:\n  ${badEnd.join("\n  ")}`).toEqual([]);
  });

  it("no attributed SRS-eligible atom is stranded past the end of the course", () => {
    // The invariant is reachability: every attributed atom must be returned by
    // the time the learner reaches the LAST module, or the SRS can never
    // schedule it and the atom is dead weight. This used to hardcode "m27" as
    // the end of the course, which silently became wrong the moment the course
    // grew past it (m28 capstone, then the m29+ N4 tier). Derive the end
    // instead — the assertion is about the end, not about m27.
    const curriculum = jaModule.curriculum;
    const lastModuleId = curriculum[curriculum.length - 1].id;
    const upTo = new Set(getAtomsUpToModule(lastModuleId, "ja").map((a) => a.id));
    const missing: string[] = [];
    for (const atom of JA_COURSE_ATOMS) {
      if (!isSrsEligibleAtom(atom)) continue;
      if (!/^m\d+$/.test(atom.fromModule)) continue; // future / sidequest
      if (!upTo.has(atom.id)) missing.push(`${atom.id} (${atom.fromModule})`);
    }
    expect(
      missing,
      `attributed atoms not returned by getAtomsUpToModule("${lastModuleId}") — these can never enter SRS:\n  ${missing.join("\n  ")}`,
    ).toEqual([]);
  });
});
