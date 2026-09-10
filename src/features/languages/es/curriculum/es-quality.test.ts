/**
 * ES course-wide QUALITY guardrails — the §13-doctrine contract.
 *
 * Rewritten 2026-08-21 when the July m1–m19 wave was archived and the
 * hand-authored §13 course (m1/m2, learner-sim-hardened, walked by Spencer)
 * became the real curriculum. The July contract lived on an 8-lesson module
 * shape (TOPIC=L1–7 / MASTERY=L8) and on step types the doctrine has since
 * ruled out (typed `translate` — guide §13.9 law 10; `self_explanation_mcq`
 * — replaced by collapsed win-explanations, the no-hollow-cards rule).
 *
 * Contract (derived from each module's own exports, never restated):
 *   - shape:       checkpoint sits at ES_Mn_CHECKPOINT_INDEX and is
 *                  zero-new (every step graded); the LAST lesson is mastery
 *                  and ENDS on a dialogue_sim (§13.9 law 7).
 *   - density:     teaching lessons 10–25 steps; checkpoint 12–22.
 *   - variety:     no two adjacent same-type steps; no 4+ consecutive
 *                  "selection" (tap-one-of-N) steps. (The July bar was 3+;
 *                  §13's debut rhythm — image-MCQ · audio-retrieval ·
 *                  image-MCQ — is a deliberate 3-run, so the marathon line
 *                  moves to 4.)
 *   - production:  every teaching lesson has ≥2 generation steps
 *                  (build/speaking — typed translate is BANNED at this
 *                  tier), ≥1 of them spoken.
 *   - compounding: every module after m1 references a PRIOR-module item in
 *                  most of its lessons (review-tail law, §13.9 law 1).
 */
import "./index";

import { describe, it, expect } from "vitest";
import type { LessonStep, MatchPairsStep } from "@/features/lesson/types";
import { ES_ALL_LESSONS } from "./index";
import { ES_M1_CHECKPOINT_INDEX } from "./m1";
import { ES_M2_CHECKPOINT_INDEX } from "./m2";
import { ES_M3_CHECKPOINT_INDEX } from "./m3";
import { ES_M4_CHECKPOINT_INDEX } from "./m4";
import { ES_M5_CHECKPOINT_INDEX } from "./m5";
import { ES_M6_CHECKPOINT_INDEX } from "./m6";
import { ES_M7_CHECKPOINT_INDEX } from "./m7";
import { ES_M8_CHECKPOINT_INDEX } from "./m8";
import { ES_M9_CHECKPOINT_INDEX } from "./m9";
import { ES_M10_CHECKPOINT_INDEX } from "./m10";
import { ES_M11_CHECKPOINT_INDEX } from "./m11";
import { ES_M12_CHECKPOINT_INDEX } from "./m12";
import { ES_M13_CHECKPOINT_INDEX } from "./m13";
import { ES_M14_CHECKPOINT_INDEX } from "./m14";
import { ES_M15_CHECKPOINT_INDEX } from "./m15";
import { ES_M16_CHECKPOINT_INDEX } from "./m16";
import { ES_M17_CHECKPOINT_INDEX } from "./m17";
import { ES_M18_CHECKPOINT_INDEX } from "./m18";
import { ES_M19_CHECKPOINT_INDEX } from "./m19";
import { ES_M20_CHECKPOINT_INDEX } from "./m20";
import { ES_M21_CHECKPOINT_INDEX } from "./m21";
import { ES_M22_CHECKPOINT_INDEX } from "./m22";
import { ES_M23_CHECKPOINT_INDEX } from "./m23";
import { ES_M24_CHECKPOINT_INDEX } from "./m24";
import { ES_M25_CHECKPOINT_INDEX } from "./m25";
import { ES_M26_CHECKPOINT_INDEX } from "./m26";
import { ES_M27_CHECKPOINT_INDEX } from "./m27";
import { ES_M28_CHECKPOINT_INDEX } from "./m28";
import { ES_M29_CHECKPOINT_INDEX } from "./m29";
import { ES_M30_CHECKPOINT_INDEX } from "./m30";
import { findEsAtomBySurface, getEsCourseAtoms, type EsAtom } from "../courseAtoms";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import { ES_VERB_ENTRIES } from "../conjugationTables";
import {
  esTokens,
  ES_FUNCTION_WORDS,
  ES_PROPER_NAMES,
  getEsGenderCanon,
  getEsPluralCanon,
} from "../__tests__/moduleBarGuards";
import type { DialogueSimStep } from "@/features/lesson/types";

const MODULE_ORDER: readonly string[] = ES_MODULE_ORDER;

/** 1-based checkpoint position per module — from the module's own export. */
const CHECKPOINT_INDEX: Record<string, number> = {
  m1: ES_M1_CHECKPOINT_INDEX,
  m2: ES_M2_CHECKPOINT_INDEX,
  m3: ES_M3_CHECKPOINT_INDEX,
  m4: ES_M4_CHECKPOINT_INDEX,
  m5: ES_M5_CHECKPOINT_INDEX,
  m6: ES_M6_CHECKPOINT_INDEX,
  m7: ES_M7_CHECKPOINT_INDEX,
  m8: ES_M8_CHECKPOINT_INDEX,
  m9: ES_M9_CHECKPOINT_INDEX,
  m10: ES_M10_CHECKPOINT_INDEX,
  m11: ES_M11_CHECKPOINT_INDEX,
  m12: ES_M12_CHECKPOINT_INDEX,
  m13: ES_M13_CHECKPOINT_INDEX,
  m14: ES_M14_CHECKPOINT_INDEX,
  m15: ES_M15_CHECKPOINT_INDEX,
  m16: ES_M16_CHECKPOINT_INDEX,
  m17: ES_M17_CHECKPOINT_INDEX,
  m18: ES_M18_CHECKPOINT_INDEX,
  m19: ES_M19_CHECKPOINT_INDEX,
  m20: ES_M20_CHECKPOINT_INDEX,
  m21: ES_M21_CHECKPOINT_INDEX,
  m22: ES_M22_CHECKPOINT_INDEX,
  m23: ES_M23_CHECKPOINT_INDEX,
  m24: ES_M24_CHECKPOINT_INDEX,
  m25: ES_M25_CHECKPOINT_INDEX,
  m26: ES_M26_CHECKPOINT_INDEX,
  m27: ES_M27_CHECKPOINT_INDEX,
  m28: ES_M28_CHECKPOINT_INDEX,
  m29: ES_M29_CHECKPOINT_INDEX,
  m30: ES_M30_CHECKPOINT_INDEX,
};

const SELECTION_TYPES = new Set<LessonStep["type"]>([
  "multiple_choice",
  "word_image_mcq",
  "particle_cloze",
  "agreement_cloze",
  "listening_comprehension",
  "self_explanation_mcq",
]);

const GENERATION_TYPES = new Set<LessonStep["type"]>(["build_sentence", "speaking"]);

function moduleOf(lessonId: string): string {
  const m = /^es-(m\d+)-/.exec(lessonId);
  return m ? m[1] : "";
}
function lessonNum(lessonId: string): number {
  const m = /^es-m\d+-(\d+)$/.exec(lessonId);
  return m ? Number(m[1]) : 0;
}
function moduleIndex(m: string): number {
  const i = MODULE_ORDER.indexOf(m);
  if (i === -1) {
    throw new Error(`es-quality moduleIndex: "${m}" is not in ES_MODULE_ORDER`);
  }
  return i;
}
function lessonCountOf(mod: string): number {
  return ES_ALL_LESSONS.filter((l) => moduleOf(l.id) === mod).length;
}
function isCheckpoint(l: { id: string }): boolean {
  return lessonNum(l.id) === CHECKPOINT_INDEX[moduleOf(l.id)];
}
function isMastery(l: { id: string }): boolean {
  return lessonNum(l.id) === lessonCountOf(moduleOf(l.id));
}

const TEACHING = ES_ALL_LESSONS.filter((l) => !isCheckpoint(l) && !isMastery(l));
const CHECKPOINTS = ES_ALL_LESSONS.filter(isCheckpoint);
const MASTERY = ES_ALL_LESSONS.filter(isMastery);

// surface / atom-id → introducing module, for the compounding-review check.
const atomModuleById = new Map<string, string>();
const atomModuleBySurface = new Map<string, string>();
for (const a of getEsCourseAtoms()) {
  if (!a.fromModule) continue;
  atomModuleById.set(a.id, a.fromModule);
  atomModuleBySurface.set(a.surface, a.fromModule);
}

/** Every string a step surfaces to the learner in the target language. */
function stepSpanishStrings(step: LessonStep): string[] {
  const s = step as Record<string, unknown>;
  const out: string[] = [];
  for (const k of ["audioText", "audioKey", "targetPhrase", "targetSentence"]) {
    if (typeof s[k] === "string") out.push(s[k] as string);
  }
  if (Array.isArray(s.tokens)) out.push(...(s.tokens as string[]));
  return out;
}

/** True when the lesson references any atom introduced by an EARLIER module —
 *  via exercisedAtoms, match_pairs sources, or a taught surface appearing
 *  token-for-token inside the step's Spanish text. */
function referencesPriorModule(steps: readonly LessonStep[], currentModule: string): boolean {
  const cur = moduleIndex(currentModule);
  const prior = (fm: string | undefined) => Boolean(fm && moduleIndex(fm) < cur);
  for (const step of steps) {
    const exercised = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
    if (exercised.some((id) => prior(atomModuleById.get(id)))) return true;
    if (step.type === "match_pairs") {
      for (const p of (step as MatchPairsStep).pairs) {
        if (prior(atomModuleBySurface.get(p.source))) return true;
      }
    }
    for (const text of stepSpanishStrings(step)) {
      const tokens = text.toLowerCase().split(/[^\p{L}\p{N}¿¡?!']+/u).filter(Boolean);
      for (const [surface, fm] of atomModuleBySurface) {
        if (!prior(fm)) continue;
        const sTokens = surface.toLowerCase().split(/\s+/);
        if (sTokens.every((t) => tokens.includes(t))) return true;
      }
    }
  }
  return false;
}

describe("ES quality — module shape (§13.9)", () => {
  it("every module has a checkpoint at its declared index and it is zero-new (all graded)", () => {
    expect(CHECKPOINTS.length).toBe(MODULE_ORDER.length);
    const bad = CHECKPOINTS.filter((l) => !l.steps.every(isGradedStep)).map((l) => l.id);
    expect(bad, `ungraded steps in checkpoint: ${bad.join(", ")}`).toEqual([]);
  });

  it("every module ENDS on a dialogue_sim (the module ends on a conversation, not a grid)", () => {
    const bad = MASTERY.filter(
      (l) => l.steps[l.steps.length - 1].type !== "dialogue_sim",
    ).map((l) => l.id);
    expect(bad, `mastery not ending on a sim: ${bad.join(", ")}`).toEqual([]);
  });
});

describe("ES quality — density & variety", () => {
  it("teaching lessons are 10–25 steps", () => {
    const bad = TEACHING.filter((l) => l.steps.length < 10 || l.steps.length > 25).map(
      (l) => `${l.id}=${l.steps.length}`,
    );
    expect(bad, `out-of-band: ${bad.join(", ")}`).toEqual([]);
  });

  it("checkpoints are 12–22 steps", () => {
    const bad = CHECKPOINTS.filter((l) => l.steps.length < 12 || l.steps.length > 22).map(
      (l) => `${l.id}=${l.steps.length}`,
    );
    expect(bad, `out-of-band: ${bad.join(", ")}`).toEqual([]);
  });

  it("no two adjacent steps share a type", () => {
    const bad: string[] = [];
    for (const l of ES_ALL_LESSONS) {
      for (let i = 1; i < l.steps.length; i++) {
        if (l.steps[i].type === l.steps[i - 1].type) {
          bad.push(`${l.id} @${i} (${l.steps[i].type})`);
        }
      }
    }
    expect(bad, `adjacent same-type: ${bad.join("; ")}`).toEqual([]);
  });

  it("no 4+ consecutive selection (tap-one-of-N) steps", () => {
    const bad: string[] = [];
    for (const l of ES_ALL_LESSONS) {
      let run = 0;
      for (let i = 0; i < l.steps.length; i++) {
        run = SELECTION_TYPES.has(l.steps[i].type) ? run + 1 : 0;
        if (run >= 4) {
          bad.push(`${l.id} @${i}`);
          run = 0;
        }
      }
    }
    expect(bad, `MCQ marathons: ${bad.join("; ")}`).toEqual([]);
  });
});

describe("ES quality — production", () => {
  it("each teaching lesson has ≥2 generation steps, ≥1 spoken; zero typed translate anywhere", () => {
    const bad: string[] = [];
    for (const l of TEACHING) {
      const gen = l.steps.filter((s) => GENERATION_TYPES.has(s.type)).length;
      const spoken = l.steps.filter((s) => s.type === "speaking").length;
      if (gen < 2 || spoken < 1) bad.push(`${l.id} (gen=${gen}, spoken=${spoken})`);
    }
    expect(bad, `under-produced: ${bad.join("; ")}`).toEqual([]);
    const translate = ES_ALL_LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "translate").map(() => l.id),
    );
    expect(translate, "typed translate is banned at beginner tier (§13.9 law 10)").toEqual([]);
  });
});

describe("ES quality — compounding review", () => {
  it("each module after m1 references a prior-module item in ≥60% of its lessons", () => {
    const bad: string[] = [];
    for (const mod of MODULE_ORDER.slice(1)) {
      const lessons = ES_ALL_LESSONS.filter((l) => moduleOf(l.id) === mod);
      const withReview = lessons.filter((l) => referencesPriorModule(l.steps, mod)).length;
      const floor = Math.ceil(lessons.length * 0.6);
      if (withReview < floor) bad.push(`${mod}=${withReview}/${lessons.length} (floor ${floor})`);
    }
    expect(bad, `weak cross-module review: ${bad.join(", ")}`).toEqual([]);
  });
});

/**
 * ES quality — dialogue_sim content resolves to registered atoms.
 *
 * ROOT CAUSE (why «de niños» shipped in BOTH m26 L10 and m27 L10, caught
 * only by human review — a3580612, 0be21768): `esSurfaces()`
 * (`__tests__/moduleBarGuards.ts`), the tokenizer every per-module
 * "vocab provenance" scan (inv 24/33) and every module's own
 * UNREGISTERED/ILLEGAL-form PIN walk from, has a `switch (step.type)` with
 * NO case for `"dialogue_sim"` — it falls through to `default: break` and
 * returns `[]`. Every dialogue_sim NPC line and reply is therefore
 * INVISIBLE to every scan built on top of `esSurfaces`, including the
 * course-wide vocab-provenance gate. What actually caught «de niños» twice
 * was a human reviewer, not a gate — the per-module PIN tests that DO read
 * sim turns (each mN.test.ts's own `allSurfacesAndNpc`) only ban a
 * hand-curated list of forms specific to THAT module's own new grammar
 * (e.g. m26's `UNREGISTERED_PRETERITE`); nothing ever generically checked
 * that a sim line's words resolve to the atom registry, so an unregistered
 * INFLECTION of an EARLIER module's atom (m22's singular-only «de niño»,
 * pluralized to «de niños» to agree with a plural subject) was invisible to
 * every existing gate — it isn't m26/m27's own new vocabulary, so it was in
 * no module's hand-curated banned-forms list either.
 *
 * This describe block does NOT touch `esSurfaces` — extending it to handle
 * `dialogue_sim` would feed sim content into 26 modules' SHRINK-ONLY debt
 * ratchets (`registerEsModuleBarGuards`'s `unknownTokens`/`nonIntroDebuts`)
 * all at once, well outside this fix's blast radius. Instead this is a
 * separate, hard-fail (zero-tolerance, no ratchet) course-wide gate scoped
 * to dialogue_sim only, built from the SAME tokenizer/registry primitives
 * (`esTokens`, `ES_FUNCTION_WORDS`, `ES_PROPER_NAMES`,
 * `getEsGenderCanon`/`getEsPluralCanon`, `getEsCourseAtoms`) the existing
 * sim/vocab gates already use — exported from `moduleBarGuards.ts`
 * specifically for this reuse (2026-09-10).
 *
 * Checked positions (mirrors the "grade answers, not every string" pin):
 * every dialogue_sim NPC line (always shown, ungraded) + every ACCEPTED
 * reply surface (build `answer`/`alsoAccepted`; choice `correctOptionId` +
 * `alsoCorrectOptionIds`). Wrong choice-mode distractors are intentional
 * foils (same carve-out `esSurfaces`'s own multiple_choice case makes) and
 * are not walked here.
 *
 * Two checks:
 *  (1) MULTI-WORD ATOM INFLECTION INTEGRITY — the exact defect class,
 *      checked over NPC lines AND accepted replies (the original bug was
 *      an NPC line). A registered multi-word atom ("de niño") may appear
 *      as its exact surface, or with a REGULAR plural/gender inflection of
 *      its final word — the SAME `getEsPluralCanon`/`getEsGenderCanon`
 *      canon exemption 2 below already applies to single-word nouns
 *      course-wide ("los libros" drills libro, "bonita" drills bonito).
 *      Agreement is grammar, not new vocabulary: a phrase atom's trailing
 *      noun still inflects for the sentence's number and gender the way a
 *      bare noun does — «de niño» with a plural subject IS «de niños»
 *      («Sam y Luis vivían en México de niños», «¿Cómo eran ustedes de
 *      niños?»), exactly as «el libro» pluralizes to «los libros» without
 *      minting a new atom. The m26/m27 precedent (a3580612, 0be21768) of
 *      mechanically forcing the atom's exact singular surface onto
 *      plural-subject sentences was the mistake this check now corrects —
 *      it produced ungrammatical Spanish to satisfy a registry that never
 *      modeled agreement in the first place. ANY inflection the canon
 *      doesn't recognize as regular (an invented form, an irregular bend)
 *      still fails, UNLESS that exact inflected string is itself a
 *      separately registered atom surface (a real, different, registered
 *      word — not a stray bend of this one).
 *  (2) WORD-LEVEL PROVENANCE — checked over ACCEPTED REPLIES ONLY (NPC
 *      lines are deliberately excluded — see below). Every content word
 *      resolves to a function word, a proper name, a registered atom
 *      surface word introduced by this lesson's module or earlier
 *      (fromModule ≤ N, cumulative), or a conjugated form of a verb whose
 *      INFINITIVE is taught by this lesson's module or earlier (gated on
 *      `introducedAtModule`, not a matching atom surface — see the
 *      exemptions note). (Tense-by-module legality — e.g. "is this
 *      preterite cell taught yet" — stays each module's own hand-curated
 *      UNREGISTERED_* scan; duplicating that per-tense calendar here is
 *      out of this fix's scope. This check only catches words with NO
 *      course provenance at all — forward references to an unregistered
 *      word, or invented non-words.)
 *
 * WHY CHECK (2) EXCLUDES NPC LINES: investigating this gate's own initial
 * failures surfaced that this course has an established, first-class
 * dialogue_sim design pattern — NPC turns tagged "fast"/"rapido" (m1–m10,
 * e.g. es-m2-9's t4-rapido) deliberately run AHEAD of the student's taught
 * vocabulary as an immersion device, rescued by the fixed survival phrase
 * "no entiendo"; "slow"/"despacio" companions use syllable-hyphenated
 * spelling ("¿Có-mo es-tás?") for pronunciation coaching. m2's own
 * `explanation` prose says so outright: "She asked if you want to go to
 * the movies tomorrow — module 3 material. «no entiendo» just saved the
 * conversation." Checking every NPC word against taught vocabulary is
 * therefore not a bug detector for this course — it is factually wrong
 * about the design. Running check (2) unscoped found 153 "unregistered"
 * words, ALL 153 in NPC position and ZERO in reply position (verified via
 * -t filter, 2026-09-10) — confirming the invariant that actually holds is
 * "the reply is decodable from taught language," not "the whole exchange
 * is." Scoped to replies only, check (2) passes CLEANLY against the
 * existing course with zero allowlist entries needed — including "no
 * entiendo" itself, which resolves because it is properly registered as
 * its own multi-word PHRASE atom (m2, `esReviewPool.ts`), not because of
 * any special-casing here.
 *
 * EXEMPTIONS (course-wide allowlist, not per-module — reasoned, listed in
 * full):
 *  - `ES_FUNCTION_WORDS` / `ES_PROPER_NAMES` (imported from
 *    `moduleBarGuards.ts` — the SAME allowlist every other ES gate uses;
 *    not restated here).
 *  - plural/gender canon (`getEsPluralCanon`/`getEsGenderCanon`): a
 *    REGULAR derived form of a registered noun/adjective word is not a
 *    separate vocabulary item, course-wide (m3/m4 doctrine — "los libros"
 *    drills libro exactly as "hablas" drills hablar). Same canon the
 *    existing vocab-provenance gate already applies to every other step
 *    type; dialogue_sim gets no special treatment.
 *  - conjugated verb forms (`ES_VERB_ENTRIES`), gated on the verb entry's
 *    own `introducedAtModule` (not a matching atom surface — several
 *    taught verbs, e.g. suppletive "ir", have no atom of their own
 *    surface) — see check (2)'s note above.
 */
describe("ES quality — dialogue_sim content resolves to registered atoms", () => {
  const ATOMS = getEsCourseAtoms();

  // Cumulative (by module, in ES_MODULE_ORDER) registered atom words —
  // the noun/adjective/etc. vocabulary a lesson in module `m` may assume.
  const cumulativeAtomWordsByModule = new Map<string, Set<string>>();
  // Cumulative multi-word atoms (surface has ≥2 words) — the carriers
  // check (1) walks.
  const cumulativeMultiWordAtomsByModule = new Map<string, EsAtom[]>();
  {
    const words = new Set<string>();
    const multi: EsAtom[] = [];
    for (const m of MODULE_ORDER) {
      for (const a of ATOMS) {
        if (a.fromModule !== m) continue;
        for (const w of esTokens(a.surface)) words.add(w);
        if (esTokens(a.surface).length >= 2) multi.push(a);
      }
      cumulativeAtomWordsByModule.set(m, new Set(words));
      cumulativeMultiWordAtomsByModule.set(m, [...multi]);
    }
  }

  // Cumulative conjugated-verb-form words, unlocked at the module the verb
  // entry itself declares (`introducedAtModule`) — the SAME field
  // conjugationTables.ts's own comments cite as the teach-date authority
  // (e.g. "ir" / M11 Vamos). An earlier draft of this gated on a matching
  // registered atom surface instead; that undercounted, because several
  // taught verbs (e.g. "ir" — voy/vas/va/vamos/van, suppletive, M11) have
  // no atom of their own surface at all — only `introducedAtModule` is
  // reliable here.
  const cumulativeVerbWordsByModule = new Map<string, Set<string>>();
  {
    const words = new Set<string>();
    for (const m of MODULE_ORDER) {
      const n = Number(m.slice(1));
      for (const v of ES_VERB_ENTRIES) {
        if (v.introducedAtModule !== n) continue;
        for (const w of esTokens(v.lemma ?? "")) words.add(w);
        for (const f of Object.values(v.forms ?? {})) {
          if (typeof f === "string") for (const w of esTokens(f)) words.add(w);
        }
      }
      cumulativeVerbWordsByModule.set(m, new Set(words));
    }
  }

  const genderCanon = getEsGenderCanon();
  const pluralCanon = getEsPluralCanon();

  /** Every printed dialogue_sim string this gate checks: NPC lines
   *  (always shown) + accepted reply surfaces (build answer/alsoAccepted,
   *  choice correct + alsoCorrect options). Distractor choice options are
   *  intentional foils and are excluded (matches esSurfaces's own MCQ
   *  carve-out).
   *
   *  `includeNpc` (default true) lets check (2) exclude NPC lines — see
   *  that check's own note on why NPC content is a different invariant
   *  from reply content in this course. */
  function dialogueSimCheckedTexts(
    step: DialogueSimStep,
    lessonId: string,
    includeNpc = true,
  ): Array<{ id: string; text: string }> {
    const out: Array<{ id: string; text: string }> = [];
    for (const t of step.turns) {
      if (includeNpc) {
        out.push({ id: `${lessonId}/${step.id}/${t.id}/npc`, text: t.npc.kana });
        if (t.npc.audioText && t.npc.audioText !== t.npc.kana) {
          out.push({ id: `${lessonId}/${step.id}/${t.id}/npc-audio`, text: t.npc.audioText });
        }
      }
      const r = t.reply;
      if (r.mode === "build") {
        out.push({ id: `${lessonId}/${step.id}/${t.id}/reply`, text: r.answer });
        for (const alt of r.alsoAccepted ?? []) {
          out.push({ id: `${lessonId}/${step.id}/${t.id}/reply-alsoAccepted`, text: alt });
        }
      } else {
        const correct = r.options.find((o) => o.id === r.correctOptionId);
        if (correct) out.push({ id: `${lessonId}/${step.id}/${t.id}/reply`, text: correct.text });
        for (const altId of r.alsoCorrectOptionIds ?? []) {
          const alt = r.options.find((o) => o.id === altId);
          if (alt) out.push({ id: `${lessonId}/${step.id}/${t.id}/reply-alsoCorrect`, text: alt.text });
        }
      }
    }
    return out;
  }

  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Loosely matches ANY plausible inflection near a multi-word atom's word
   *  sequence (regular plural -s/-es on any word; the sanctioned -o/-a
   *  gender swap on the last word) so check (1) can judge the CAPTURED text
   *  narrowly against `isSanctionedMultiWordVariant` below — deliberately
   *  broad on the capture side, narrow on the judgment side. */
  function multiWordAtomVariantRegex(surface: string): RegExp {
    const words = surface.toLowerCase().split(/\s+/);
    const last = words.length - 1;
    const parts = words.map((w, i) => {
      if (i === last && /[oa]$/.test(w)) {
        const stem = escapeRegExp(w.slice(0, -1));
        return `${stem}[oa]s?`;
      }
      return `${escapeRegExp(w)}(?:e?s)?`;
    });
    return new RegExp(`\\b${parts.join("\\s+")}\\b`, "giu");
  }

  /** Mirrors moduleBarGuards.ts's private `esRegularPlurals` suffix rules
   *  (vowel-ending → +s, z → -z+ces, -ón → -ón+ones, consonant → +es,
   *  already-s invariant). Applied directly to a multi-word atom's OWN
   *  final word rather than through `getEsPluralCanon`'s registered-word
   *  lookup: that map only knows a plural for a word that is ITSELF an
   *  independently registered atom surface (course-wide, e.g. "niño" is,
   *  because "de niño" registers it) — it has no entry for a derived
   *  gender-swap that nothing separately registers (e.g. "niña"). A
   *  compound inflection (gender THEN number — "niñas") needs the same
   *  regular rule applied to the swapped candidate, not a second map hit.
   *  Same rule, applied where the coverage gap actually is. */
  function regularPluralsOf(word: string): string[] {
    if (word.length < 2) return [];
    if (/s$/.test(word)) return [word];
    if (/z$/.test(word)) return [`${word.slice(0, -1)}ces`];
    if (/ón$/.test(word)) return [`${word.slice(0, -2)}ones`];
    if (/[aeiouáéíóú]$/.test(word)) return [`${word}s`];
    return [`${word}es`];
  }

  /** Whether `matched` (lowercased, split) is a legal appearance of a
   *  registered multi-word atom (lowercased, split): the exact registered
   *  surface, OR a REGULAR plural and/or gender inflection of its final
   *  word only — every other word in the phrase must match exactly.
   *  Agreement is grammar, not new vocabulary: a phrase atom's trailing
   *  noun inflects for number/gender exactly as a bare registered noun
   *  does (`getEsPluralCanon`/`getEsGenderCanon`'s own course-wide
   *  exemption, applied below to single-word nouns/adjectives in check
   *  (2)) — "de niño" pluralizes to "de niños" the same way "el libro"
   *  pluralizes to "los libros" without minting a new atom. A fabricated
   *  or irregular bend (e.g. «de niñes») is NOT in the regular set below
   *  and still fails. */
  function isSanctionedMultiWordVariant(matched: string, atomSurface: string): boolean {
    const atomWords = atomSurface.toLowerCase().split(/\s+/);
    const matchedWords = matched.toLowerCase().split(/\s+/);
    if (atomWords.length !== matchedWords.length) return false;
    const last = atomWords.length - 1;
    for (let i = 0; i < last; i++) {
      if (matchedWords[i] !== atomWords[i]) return false;
    }
    const lastAtom = atomWords[last];
    const lastMatched = matchedWords[last];
    if (lastMatched === lastAtom) return true;
    const candidates = new Set<string>([lastAtom]);
    if (/o$/.test(lastAtom)) candidates.add(`${lastAtom.slice(0, -1)}a`);
    for (const c of [...candidates]) {
      for (const p of regularPluralsOf(c)) candidates.add(p);
    }
    // Cross-check against the course-wide canon too, in case the matched
    // form is independently registered/derivable there (belt-and-braces;
    // doesn't change the outcome for words the canon has no entry for).
    if (pluralCanon.get(lastMatched) === lastAtom) return true;
    if (genderCanon.get(lastMatched) === lastAtom) return true;
    return candidates.has(lastMatched);
  }

  it(
    "no dialogue_sim NPC line or accepted reply carries an unregistered inflection of a registered multi-word atom " +
      "(the «de niño»→«de niños» defect class — a3580612, 0be21768)",
    () => {
      const bad: string[] = [];
      for (const lesson of ES_ALL_LESSONS) {
        const mod = moduleOf(lesson.id);
        if (!mod) continue;
        const carriers = cumulativeMultiWordAtomsByModule.get(mod) ?? [];
        if (carriers.length === 0) continue;
        for (const step of lesson.steps) {
          if (step.type !== "dialogue_sim") continue;
          for (const { id, text } of dialogueSimCheckedTexts(step as DialogueSimStep, lesson.id)) {
            const lower = text.toLowerCase();
            for (const atom of carriers) {
              for (const m of lower.matchAll(multiWordAtomVariantRegex(atom.surface))) {
                const matched = m[0].replace(/\s+/g, " ").trim();
                if (isSanctionedMultiWordVariant(matched, atom.surface)) continue;
                // A separately, genuinely registered atom surface that
                // happens to match the loose capture (a real different
                // word) is not a stray inflection of THIS atom.
                if (findEsAtomBySurface(matched)) continue;
                bad.push(
                  `${id}: «${matched}» in «${text}» — unregistered inflection of atom «${atom.surface}» (${atom.fromModule})`,
                );
              }
            }
          }
        }
      }
      expect(
        bad,
        `unregistered inflection of a registered multi-word atom in dialogue_sim:\n${bad.join("\n")}`,
      ).toEqual([]);
    },
  );

  it(
    "every content word in a dialogue_sim accepted reply resolves to a registered atom, a taught verb " +
      "conjugation, a function word, or a proper name — cumulative to that lesson's module " +
      "(NPC lines excluded — see the describe-block note on the «rapido»/«despacio» exposure pattern)",
    () => {
      const bad: string[] = [];
      for (const lesson of ES_ALL_LESSONS) {
        const mod = moduleOf(lesson.id);
        if (!mod) continue;
        const knownAtoms = cumulativeAtomWordsByModule.get(mod) ?? new Set<string>();
        const knownVerbs = cumulativeVerbWordsByModule.get(mod) ?? new Set<string>();
        for (const step of lesson.steps) {
          if (step.type !== "dialogue_sim") continue;
          // includeNpc=false — see the "why NPC lines are excluded" note
          // on this describe block.
          for (const { id, text } of dialogueSimCheckedTexts(step as DialogueSimStep, lesson.id, false)) {
            for (const raw of esTokens(text)) {
              if (ES_FUNCTION_WORDS.has(raw) || ES_PROPER_NAMES.has(raw)) continue;
              // Regular derived forms fold to their registered base — but
              // ONLY when the raw token itself is not already known (a
              // registered plural/feminine keeps its own identity).
              const t = knownAtoms.has(raw)
                ? raw
                : (pluralCanon.get(raw) ?? genderCanon.get(raw) ?? raw);
              if (knownAtoms.has(t) || knownVerbs.has(raw) || knownVerbs.has(t)) continue;
              bad.push(`${id}: unregistered word "${raw}" in "${text}" (module ${mod})`);
            }
          }
        }
      }
      expect(
        bad,
        `unregistered word in dialogue_sim (fromModule ≤ N):\n${bad.join("\n")}`,
      ).toEqual([]);
    },
  );
});
