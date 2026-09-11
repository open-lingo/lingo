/**
 * FR MCQ/cloze DISTRACTOR vocab-provenance gate — closes the gap the m19
 * review found by hand: two placement MCQ distractors («on mange une
 * pizza», «je ne mange pas de gâteau», `pt-fr-m19-3`/`pt-fr-m19-4`) used a
 * bare-present form of «manger» that is taught NOWHERE in the course (m19
 * only ever teaches «va/vais/vas manger», the aller+infinitif construction
 * — never bare «mange»). It was gate-invisible for two independent
 * reasons:
 *   1. `frSurfaces()` (`../__tests__/moduleBarGuards.ts`) scans only the
 *      CORRECT option of a `multiple_choice` step — deliberate, matching
 *      "grade answers, not every string": a distractor is allowed to be a
 *      wrong-SHAPED foil, so `frSurfaces` never claims a distractor is
 *      taught content;
 *   2. `lintMcqDistractorsCore`'s invented-form check
 *      (`@/shared/lessonAuthoring/mcqDistractorLint.ts`) only runs against
 *      `realFormLexicon` for single-answer TILE pickers (build/listening
 *      steps with one correct order), never for full-sentence MCQ options.
 * Both gaps are correct AS DESIGNED for the property each actually checks —
 * neither was ever a distractor-provenance gate. FR doctrine
 * (`docs/fr-authoring-playbook.md`, every FR author brief) requires
 * distractors be REAL TAUGHT SURFACES regardless: a learner reasons by
 * elimination, and an untaught form in a distractor is either an unfair
 * trap or teaches a wrong form by exposure. This file is that check.
 *
 * SIBLING-PARITY NOTE (FR-specific, deliberately NOT ported from ES):
 * `esSurfaces` (`es/__tests__/moduleBarGuards.ts`) explicitly and
 * DELIBERATELY does not bill multiple_choice/word_image_mcq/
 * agreement_cloze distractors — Spanish's discrimination drills offer
 * deliberately-wrong CONJUGATED forms («penso» for «pienso») as their
 * pedagogy, the JA derivation-drill exemption class (pin §0 inv 10): a
 * wrong conjugation of a taught verb is not an untaught word, it's the
 * point of the drill. FR authors no MCQ conjugation-discrimination drill
 * (conjugation is drilled via `conjugation_cloze`/`agreement_chain`/build,
 * not MCQ), so this gate does NOT need that exemption — but it needs the
 * FR-specific ANALOGUE of it: m15's h-aspiré-vs-mute-h contrast («la
 * halle», never «l'halle», unlike «l'hôtel») is exactly the same drill
 * SHAPE (a wrong morphological transform of a taught word, offered as the
 * deliberate minimal-pair foil the lesson is explicitly ABOUT), just
 * ELISION instead of conjugation. See `buildAtomModuleNumByToken`'s
 * `isConsonantOnset` branch below for the narrow, documented exemption
 * this gate carries for that class — do not weaken the gate generally to
 * make room for it, and do not add a THIRD such exemption without an
 * equally specific, content-grounded justification.
 *
 * WHAT THIS WALKS: every FR module m2–m26, both:
 *   - every step in `lessons[].steps`;
 *   - every placement item in `FR_M{n}_PLACEMENT` — `.build()`'d, since a
 *     `PlacementItem` is a lazy factory, not itself a step (this is where
 *     BOTH the m19 hits actually shipped: placement content is NOT part of
 *     `lessons`, so `frSurfaces`/`registerFrModuleBarGuards` never walk it
 *     at all — a second, independent invisibility this gate also closes).
 * — restricted to step types whose OPTION TEXT is French (see
 * `SCANNED_TYPES` below); for each, every option OTHER than the correct
 * one is tokenized and checked `taught-module ≤ this module`.
 *
 * SCANNED_TYPES, and why each is/isn't in:
 *   - `multiple_choice` (incl. everything built via `sentenceMcq()` and
 *     `vocabTextMcq()`, and every placement item — all compile to this
 *     type): the m19 defect class exactly.
 *   - `word_image_mcq` (`vocabMcq()`): `options[].word` is always French
 *     (`withArticle(surface)` of a registered atom or an author-supplied
 *     distractor surface) — never English. In scope.
 *   - `particle_cloze` (`cloze()`): `options` are French particles/forms.
 *     In scope. (The existing per-module "particle_cloze items belong to
 *     this module" gate checks only `correctParticle`'s module against a
 *     hand-maintained `priorModules` list; this gate additionally checks
 *     every OPTION — including wrong ones — against the course-wide,
 *     token-level earliest-teaching-module map, independent of that list.)
 *   - `listening_comprehension` (`listeningCompSentence()`) is EXCLUDED:
 *     its options are `correctMeaningEn`/`distractorsEn` — English
 *     comprehension-check glosses, never French. Scanning them against a
 *     French lexicon would be a category error (and — since `frTokens`
 *     matches any run of Latin letters regardless of language — a source
 *     of pure false positives, not a stricter check).
 *   - `self_explanation_mcq` (`selfExplain()`) and `dialogue_listen`: both
 *     are option-bearing step types in the shared type system, but FR
 *     authors NEITHER anywhere in m2–m26 (verified via a census of every
 *     `step.type` across all 18 modules' lessons + placement items — zero
 *     occurrences of either). Left OUT of `SCANNED_TYPES` rather than
 *     speculatively included: whether their option text is French or
 *     English is undetermined without a real instance to inspect. The
 *     first FR module to author one must classify it (read the factory
 *     that builds it, same as this header did for the six types above)
 *     and add it to `SCANNED_TYPES` if its options are French — do not
 *     leave a new instance unscanned by omission.
 *   - `dialogue_sim` distractor-shaped content (wrong reply-tile-bank
 *     entries, wrong choice options) stays OUT OF SCOPE here — it is
 *     `frSimProvenance.test.ts`'s domain (see that file's header
 *     "WHAT IS DELIBERATELY NOT WALKED": non-correct dialogue_sim choice
 *     options are exempt from IT too, same "grade answers, not every
 *     string" doctrine, not duplicated here).
 *
 * TOKENIZER / REGISTRY: reuses `frTokens`, `FR_FUNCTION_WORDS`,
 * `FR_PROPER_NAMES` from `../__tests__/moduleBarGuards` and
 * `getFrCourseAtoms()` / `elidesBefore()` from `../courseAtoms` — the SAME
 * machinery `frSimProvenance.test.ts` uses, no second tokenizer.
 * `choiceSets()` from `@/shared/lessonAuthoring/mcqDistractorLint` (the
 * SAME normalizer `lintMcqDistractorsCore`/GATE 5 already uses) supplies
 * `{ prompt, options, correct }` per step so this file does not re-derive
 * per-type option shapes by hand.
 *
 * `ATOM_MODULE_NUM_BY_TOKEN` below STARTS as a duplicate of
 * `frSimProvenance.test.ts`'s identically-named/-bodied function, for
 * exactly the reason that file's own header gives for not reusing
 * `getFrRealFormLexicon()`: that function only answers "is this token ever
 * taught", not "in which module number" — a `.test.ts` module is also not
 * a normal import target (importing one would re-register its `describe`
 * blocks into this file's suite). It then DELIBERATELY DIVERGES in two
 * documented ways, both found by running this gate against real content
 * (not spitballed in advance — see the two branches inline for the
 * content each one closes):
 *   1. carrier-atom STEM derivation for apostrophe-FUSED phrase atoms
 *      (m3's «j'aime» never separately surfaces bare «aime» to the
 *      tokenizer, unlike space-separated «tu aimes») — a general
 *      correctness fix, not a distractor-only tolerance;
 *   2. the `isConsonantOnset` wrong-elision tolerance described in the
 *      sibling-parity note above — a distractor-only tolerance.
 * Fix (1) would likely also benefit `frSimProvenance.test.ts` (it has the
 * identical gap); fix (2) must NOT be ported there — dialogue_sim content
 * must never show a wrong elision as if it were fine. Porting either is
 * out of scope for this task (touching that file was not asked for and
 * risks the in-flight m20 lane); flagged here for a coordinator to pick up.
 * Keep this noted at the top of any future edit to either copy.
 *
 * EXEMPTIONS (course-wide, generic, no per-module list):
 *   1. `FR_FUNCTION_WORDS` — closed-class function words/copulas.
 *   2. `FR_PROPER_NAMES` — course cast + place names.
 *   3. Multi-word carrier atoms need no separate exemption — component
 *      words are tokenized into the module map at atom-registration time
 *      (carrier-atom doctrine, same as `frSimProvenance.test.ts` §3).
 *   4. Digits: `frTokens` never matches a numeral (letters only) — same as
 *      `frSimProvenance.test.ts` §4.
 * No §13.6 tease/NPC-formula exemption here: those are dialogue_sim-only
 * content-structure markers (an NPC line, never a gradable distractor) and
 * do not apply to MCQ/cloze option text.
 *
 * EVERY new FR module must be added to `MODULES` below when it lands
 * (coordinator checklist — same as `frSimProvenance.test.ts`).
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import {
  frTokens,
  FR_FUNCTION_WORDS,
  FR_PROPER_NAMES,
} from "../__tests__/moduleBarGuards";
import { getFrCourseAtoms, elidesBefore, isConsonantOnset } from "../courseAtoms";
import { choiceSets } from "@/shared/lessonAuthoring/mcqDistractorLint";

import { FR_M2_MODULE, FR_M2_PLACEMENT } from "./m2";
import { FR_M3_MODULE, FR_M3_PLACEMENT } from "./m3";
import { FR_M4_MODULE, FR_M4_PLACEMENT } from "./m4";
import { FR_M5_MODULE, FR_M5_PLACEMENT } from "./m5";
import { FR_M6_MODULE, FR_M6_PLACEMENT } from "./m6";
import { FR_M7_MODULE, FR_M7_PLACEMENT } from "./m7";
import { FR_M8_MODULE, FR_M8_PLACEMENT } from "./m8";
import { FR_M9_MODULE, FR_M9_PLACEMENT } from "./m9";
import { FR_M10_MODULE, FR_M10_PLACEMENT } from "./m10";
import { FR_M11_MODULE, FR_M11_PLACEMENT } from "./m11";
import { FR_M12_MODULE, FR_M12_PLACEMENT } from "./m12";
import { FR_M13_MODULE, FR_M13_PLACEMENT } from "./m13";
import { FR_M14_MODULE, FR_M14_PLACEMENT } from "./m14";
import { FR_M15_MODULE, FR_M15_PLACEMENT } from "./m15";
import { FR_M16_MODULE, FR_M16_PLACEMENT } from "./m16";
import { FR_M17_MODULE, FR_M17_PLACEMENT } from "./m17";
import { FR_M18_MODULE, FR_M18_PLACEMENT } from "./m18";
import { FR_M19_MODULE, FR_M19_PLACEMENT } from "./m19";
import { FR_M20_MODULE, FR_M20_PLACEMENT } from "./m20";
import { FR_M21_MODULE, FR_M21_PLACEMENT } from "./m21";
import { FR_M22_MODULE, FR_M22_PLACEMENT } from "./m22";
import { FR_M23_MODULE, FR_M23_PLACEMENT } from "./m23";
import { FR_M24_MODULE, FR_M24_PLACEMENT } from "./m24";
import { FR_M25_MODULE, FR_M25_PLACEMENT } from "./m25";
import { FR_M26_MODULE, FR_M26_PLACEMENT } from "./m26";

// ─── Module inventory (m2–m26; m1 is not in range, matches frSimProvenance) ─

const MODULES: ReadonlyArray<{
  id: string;
  n: number;
  lessons: LessonContent[];
  placement: PlacementItem[];
}> = [
  { id: "m2", n: 2, lessons: FR_M2_MODULE.lessons, placement: FR_M2_PLACEMENT },
  { id: "m3", n: 3, lessons: FR_M3_MODULE.lessons, placement: FR_M3_PLACEMENT },
  { id: "m4", n: 4, lessons: FR_M4_MODULE.lessons, placement: FR_M4_PLACEMENT },
  { id: "m5", n: 5, lessons: FR_M5_MODULE.lessons, placement: FR_M5_PLACEMENT },
  { id: "m6", n: 6, lessons: FR_M6_MODULE.lessons, placement: FR_M6_PLACEMENT },
  { id: "m7", n: 7, lessons: FR_M7_MODULE.lessons, placement: FR_M7_PLACEMENT },
  { id: "m8", n: 8, lessons: FR_M8_MODULE.lessons, placement: FR_M8_PLACEMENT },
  { id: "m9", n: 9, lessons: FR_M9_MODULE.lessons, placement: FR_M9_PLACEMENT },
  { id: "m10", n: 10, lessons: FR_M10_MODULE.lessons, placement: FR_M10_PLACEMENT },
  { id: "m11", n: 11, lessons: FR_M11_MODULE.lessons, placement: FR_M11_PLACEMENT },
  { id: "m12", n: 12, lessons: FR_M12_MODULE.lessons, placement: FR_M12_PLACEMENT },
  { id: "m13", n: 13, lessons: FR_M13_MODULE.lessons, placement: FR_M13_PLACEMENT },
  { id: "m14", n: 14, lessons: FR_M14_MODULE.lessons, placement: FR_M14_PLACEMENT },
  { id: "m15", n: 15, lessons: FR_M15_MODULE.lessons, placement: FR_M15_PLACEMENT },
  { id: "m16", n: 16, lessons: FR_M16_MODULE.lessons, placement: FR_M16_PLACEMENT },
  { id: "m17", n: 17, lessons: FR_M17_MODULE.lessons, placement: FR_M17_PLACEMENT },
  { id: "m18", n: 18, lessons: FR_M18_MODULE.lessons, placement: FR_M18_PLACEMENT },
  { id: "m19", n: 19, lessons: FR_M19_MODULE.lessons, placement: FR_M19_PLACEMENT },
  { id: "m20", n: 20, lessons: FR_M20_MODULE.lessons, placement: FR_M20_PLACEMENT },
  { id: "m21", n: 21, lessons: FR_M21_MODULE.lessons, placement: FR_M21_PLACEMENT },
  { id: "m22", n: 22, lessons: FR_M22_MODULE.lessons, placement: FR_M22_PLACEMENT },
  { id: "m23", n: 23, lessons: FR_M23_MODULE.lessons, placement: FR_M23_PLACEMENT },
  { id: "m24", n: 24, lessons: FR_M24_MODULE.lessons, placement: FR_M24_PLACEMENT },
  { id: "m25", n: 25, lessons: FR_M25_MODULE.lessons, placement: FR_M25_PLACEMENT },
  { id: "m26", n: 26, lessons: FR_M26_MODULE.lessons, placement: FR_M26_PLACEMENT },
  // EVERY new FR module must be added here when it lands (coordinator checklist).
];

// ─── Token → earliest-teaching-module map (mirrors frSimProvenance.test.ts) ─

/** See file header: a deliberate, documented duplicate of
 *  `frSimProvenance.test.ts`'s identically-bodied function — that file's
 *  header explains why this can't just call `getFrRealFormLexicon()`
 *  (module-membership only, no module NUMBER) or import a `.test.ts` file
 *  (would re-register its `describe` blocks). Keep in sync if the
 *  elided-clitic derivation changes. */
function buildAtomModuleNumByToken(): Map<string, number> {
  const map = new Map<string, number>();
  const moduleNum = (m: string) => Number(m.replace(/^m/, ""));
  for (const a of getFrCourseAtoms()) {
    if (!a.fromModule) continue;
    const n = moduleNum(a.fromModule);
    const toks = frTokens(a.surface);
    for (const w of toks) {
      if (!map.has(w)) map.set(w, n);
      // DIVERGENCE 1 (see file header) — carrier-atom STEM derivation.
      // `frTokens` keeps an elided clitic glued to its word as ONE token
      // (pin F4/F11: «j'aime», «n'aime» are single lexical items), so a
      // FUSED phrase atom like m3's «j'aime» (surface "j'aime") never
      // separately registers the bare word "aime" the tokenizer would give
      // a space-separated carrier atom like «tu aimes» → "tu", "aimes".
      // The stem IS taught the moment the phrase is — a learner who has
      // met «j'aime» recognizes «aime» on sight — so derive it: strip any
      // leading `<clitic>'` off a token and register what's left, at the
      // SAME module. (m3's «je n'aime pas» → tokens "je", "n'aime", "pas"
      // → this also registers "aime" from "n'aime".)
      const stem = /^[a-zàâæçéèêëîïôœùûüÿ]+'(.+)$/.exec(w)?.[1];
      if (stem && !map.has(stem)) map.set(stem, n);
    }
    if (elidesBefore(a)) {
      const first = toks[0];
      if (first) {
        for (const clitic of ["l", "j", "n", "m", "t", "s", "qu"]) {
          const key = `${clitic}'${first}`;
          if (!map.has(key)) map.set(key, n);
        }
      }
    } else if (isConsonantOnset(a)) {
      // DIVERGENCE 2 (see file header + sibling-parity note) — the FR
      // analogue of ES's wrong-conjugation-distractor exemption. A
      // consonant-onset atom (h aspiré «halle»; the «onze»/«huit» glide
      // class) grammatically does NOT elide — that IS the taught rule —
      // but a WRONGLY elided form of it («l'halle») is the exact,
      // deliberate minimal-pair foil m15 teaches against («la halle»,
      // never «l'halle», unlike m4's «l'hôtel»). Register the mis-elided
      // form too, at the atom's own module: a distractor built from it
      // reads as "real taught word, wrong shape" (the doctrine's own
      // allowance — see the m19 va/a fix) rather than "untaught word".
      // Distractor-gate-only: see the file header for why this must NOT
      // be ported to `frSimProvenance.test.ts`'s copy of this function.
      const first = toks[0];
      if (first) {
        for (const clitic of ["l", "j", "n", "m", "t", "s", "qu"]) {
          const key = `${clitic}'${first}`;
          if (!map.has(key)) map.set(key, n);
        }
      }
    }
  }
  return map;
}

const ATOM_MODULE_NUM_BY_TOKEN = buildAtomModuleNumByToken();

// ─── Which option-bearing step types carry FRENCH option text ────────────

/** See file header for the per-type classification. Only these three: every
 *  other `choiceSets`-recognized type either doesn't occur in FR yet
 *  (`self_explanation_mcq`, `dialogue_listen`) or carries English option
 *  text by construction (`listening_comprehension`). */
const SCANNED_TYPES: ReadonlySet<string> = new Set([
  "multiple_choice",
  "word_image_mcq",
  "particle_cloze",
]);

// ─── The gate ──────────────────────────────────────────────────────────────

type Hit = {
  moduleId: string;
  lessonId: string;
  stepId: string;
  token: string;
  surface: string;
  reason: string;
};

function checkDistractors(
  moduleId: string,
  moduleN: number,
  lessonId: string,
  cs: ReturnType<typeof choiceSets>[number],
  hits: Hit[],
): void {
  for (const opt of cs.options) {
    if (opt === cs.correct) continue; // the correct answer is frSurfaces's job
    for (const t of frTokens(opt)) {
      if (FR_FUNCTION_WORDS.has(t) || FR_PROPER_NAMES.has(t)) continue;
      const taughtIn = ATOM_MODULE_NUM_BY_TOKEN.get(t);
      if (taughtIn === undefined) {
        hits.push({
          moduleId,
          lessonId,
          stepId: cs.stepId,
          token: t,
          surface: opt,
          reason: "never taught in any module",
        });
      } else if (taughtIn > moduleN) {
        hits.push({
          moduleId,
          lessonId,
          stepId: cs.stepId,
          token: t,
          surface: opt,
          reason: `taught in m${taughtIn}, used before it's taught (m${moduleN})`,
        });
      }
    }
  }
}

function walk(): Hit[] {
  const hits: Hit[] = [];
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      for (const step of lesson.steps) {
        if (!SCANNED_TYPES.has(step.type)) continue;
        for (const cs of choiceSets(step)) {
          checkDistractors(mod.id, mod.n, lesson.id, cs, hits);
        }
      }
    }
    for (const item of mod.placement) {
      const step = item.build();
      if (!SCANNED_TYPES.has(step.type)) continue;
      for (const cs of choiceSets(step)) {
        checkDistractors(mod.id, mod.n, "(placement)", cs, hits);
      }
    }
  }
  return hits;
}

describe("FR MCQ/cloze distractor vocab provenance (m2–m26)", () => {
  it("every distractor token in every multiple_choice/word_image_mcq/particle_cloze step (lessons + placement) resolves to an atom taught at or before this module", () => {
    const hits = walk();
    const fmt = hits.map(
      (h) =>
        `${h.moduleId}/${h.lessonId}/${h.stepId}: "${h.token}" (${h.reason}) — in "${h.surface.slice(0, 70)}"`,
    );
    expect(fmt).toEqual([]);
  });
});
