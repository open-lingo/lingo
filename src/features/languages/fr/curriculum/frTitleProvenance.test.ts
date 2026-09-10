/**
 * FR TITLE vocab-provenance gate — closes the gap the m20 reviewer (commit
 * 3004d96f) found by hand: `LessonContent.title` and `dialogue_sim`
 * `scene.title` strings carried untaught French words («Hugo vient
 * d'arriver», «Camille vient de finir» — arriver/finir taught NOWHERE in the
 * course) and a fully green suite let them through:
 *   - `frSimProvenance.test.ts` walks `dialogue_sim` NPC `kana`/`audioText` +
 *     the learner's reply only (see that file's own field list) — never
 *     `scene.title`;
 *   - `frDistractorProvenance.test.ts` walks MCQ/cloze OPTION text — no
 *     notion of a "title" exists in its scope at all;
 *   - the per-module `registerFrModuleBarGuards` "vocab provenance" check
 *     (`moduleBarGuards.ts`) runs `frSurfaces(step)` on every step, but
 *     `frSurfaces`'s `"info"` case extracts ONLY the «guillemet»-quoted
 *     spans out of `${title} ${body}` (see that function, case "info") — an
 *     ordinary title with no guillemets (e.g. m12's pre-fix "Après dix,
 *     vingt", plain prose, no «» anywhere) contributes NOTHING to that
 *     check; `frSurfaces` also has no
 *     `dialogue_sim` case at all (the same known gap `frSimProvenance`'s own
 *     header documents), and no LessonContent-level case is possible in the
 *     first place — `frSurfaces(step: LessonStep)` takes a STEP, and a
 *     module/lesson title is not a step, so it is structurally invisible to
 *     every existing per-step walker.
 * A learner-facing title is exposure like any other string the learner
 * reads: the comprehensibility-gating lens (CLAUDE.md — "every content word
 * must decompose into atoms already taught by this point") makes no
 * exception for headings. This file is that check.
 *
 * WHAT THIS WALKS: every FR module m2–m20 (mirrors `frDistractorProvenance`/
 * `frSimProvenance`'s inventory and import style — see `MODULES` below), two
 * fields:
 *   1. `LessonContent.title` — every lesson's own title, once per lesson;
 *   2. `DialogueSimStep.scene.title` — every `dialogue_sim` step's scene
 *      heading (the exact field the m20 defect shipped in), plus, while
 *      walking `dialogue_sim` steps anyway, `InfoStep.title` is walked
 *      alongside it (see the step-type census below) since it is the OTHER
 *      populated title-ish field FR content actually authors.
 * Placement items (`FR_M{n}_PLACEMENT`) are NOT walked: every placement item
 * `.build()`s a `multiple_choice` step (`sentenceMcq`/`vocabTextMcq`) —
 * verified via a census of every FR placement factory course-wide — and
 * `MultipleChoiceStep` carries no title-ish field (it has `prompt`, already
 * `frDistractorProvenance`'s domain for its option text; the prompt itself
 * is out of scope for the same reason a build-step prompt is out of scope
 * for `frSurfaces` — prompts are English framing text by course convention,
 * never a graded/exposure French surface). No placement item anywhere
 * constructs a title-bearing step type, so there is nothing this gate would
 * find by walking `.build()` — left out rather than walked-and-always-empty.
 *
 * STEP-TYPE CENSUS (every `StepType` in `@/features/lesson/types.ts` — that
 * file lives under `src/features/lesson/`, not `src/shared/domain/` as one
 * might expect from the course-map pointer in CLAUDE.md; `LessonContent` and
 * `LessonStep` are both defined there, confirmed by direct read) — six
 * fields in the whole type file match `/title/` at all:
 *   - `LessonContent.title` — SCANNED (see above).
 *   - `InfoStep.title?` — SCANNED. Populated on every FR `info` step via the
 *     `infoStep(id, title, body, variant?)` factory (`grammarHelpers.ts`)
 *     — a required positional parameter, so every authored `info` step in
 *     FR content actually carries one; confirmed rendered learner-facing
 *     (`InfoStepView.tsx`: `{step.title && (...)}`, a heading above the
 *     body). Titles are mixed French/English by design (`m13.ts`: "En
 *     français parlé…" pre-fix, now "In spoken French…"; `m1.ts`: "French
 *     hides its letters") — see the FR/English heuristic below for how this
 *     gate tells which titles are vocabulary claims.
 *   - `DialogueSimStep.scene.title` — SCANNED (see above; not itself an
 *     optional field, always present on a `dialogue_sim` step).
 *   - `GrammarRuleStep.title` — type `"grammar_rule"`. SKIPPED: a census of
 *     every FR curriculum file (`grep -n 'type: "grammar_rule"'` across
 *     `m2.ts`–`m20.ts`, and no `grammarRule(...)`-shaped factory exists in
 *     `grammarHelpers.ts` either) finds ZERO occurrences — FR authors no
 *     `grammar_rule` step anywhere in the live course. Nothing to walk. If
 *     a future FR module authors one, its title must be added to this
 *     gate's field list — same "the first module to author a new shape
 *     must classify it" rule `frDistractorProvenance`'s header states for
 *     `self_explanation_mcq`/`dialogue_listen`.
 *   - `RuleHint.title` and `ReactiveGrammarTip.title` — SKIPPED, for a
 *     different reason than the above: these are not authored directly in
 *     any `mN.ts` curriculum file at all (a repo-wide grep for
 *     `deriveGrammarMicroSteps`/`ruleHint`/`reactiveGrammarTip` under
 *     `src/features/languages/fr/` returns nothing). They are attached to a
 *     step's `StepBase.ruleHint`/`.reactiveGrammarTip` at RUNTIME by
 *     `deriveGrammarMicroSteps`, keyed off `grammarPointId` — a derived
 *     view-layer artifact, not part of the static `LessonContent` this
 *     gate (like its two siblings) imports and walks directly from the
 *     `mN.ts` source modules. Structurally absent from what MODULES below
 *     exposes; not a scope choice, there is nothing here to scan.
 * Also considered and deliberately NOT treated as a "title" field (so as
 * not to invent a new class of check beyond what was asked): the various
 * `label` fields on `SceneSpec` variants (`TransferDiagramParty.label`,
 * `TimelineFrame.label`, `ScaleItem.label`, `RegisterAudienceView.label`,
 * …) and `GenderSortStep`'s bucket `{ id, label }` pairs. The `SceneSpec`
 * labels are reachable only through `GrammarRuleStep.scene`/`RuleHint.scene`
 * — already out of scope per the `grammar_rule` census above (FR authors
 * none) — and `GenderSortStep` bucket labels are short UI micro-chrome
 * composed of already-exempt function words in this course ("le (blue-m)",
 * "la (pink-f)" — `getFrCourseAtoms` census confirms FR never authors a
 * gender_sort bucket label containing a content word), not a heading a
 * learner reads as a vocabulary claim the way a lesson/scene title is.
 *
 * FR/ENGLISH TITLE HEURISTIC — deliberately NOT `looksFrench()`
 * (`moduleBarGuards.ts`): that function's fast path — "any «guillemet» OR
 * any accented character anywhere in the string ⇒ the whole string is
 * French" — is correct for the MCQ-option text it was built for (an option
 * is either a French answer or an English gloss, never both), but titles in
 * this course routinely mix an ENGLISH framing sentence with an embedded,
 * accented FRENCH PROPER NAME ("Léa heads out", "A friend of Léa's",
 * "Chloé, still melted") OR splice an English descriptive clause next to a
 * French one on a course-standard separator ("La gare, 9h — Louis arrives",
 * "✓ Checkpoint · La négation", "Halle or hôtel?"). Run unmodified against
 * those, `looksFrench` fires on the accent in "Léa"/"Chloé"/"négation" and
 * would then hand this gate's token check "heads", "out", "friend", "still",
 * "melted", "arrives", "checkpoint", "or" — none ever taught, none French —
 * a wall of false positives on titles (or title CLAUSES) that are not
 * French at all. `titleSurfacesToScan()` below fixes this THREE ways:
 *   1. Every «guillemet»-quoted span is ALWAYS scanned as French — the
 *      course's own convention (documented in `moduleBarGuards.ts`'s
 *      `FRENCH_MARK` comment: "the course quotes French — and only
 *      French — in guillemets") and independent of the rest of the title
 *      (so a mostly-English title that quotes one French phrase, e.g. a
 *      hypothetical `«parler»` aside, still gets that phrase checked even
 *      though the surrounding prose does not).
 *   2. The REMAINDER (title with quoted spans stripped) is split into
 *      CLAUSES on the course's own bilingual separators (em dash, middle
 *      dot, " vs ", " or " — see `TITLE_CLAUSE_SPLIT`) BEFORE voting, and
 *      each clause is voted independently. This is what actually resolves
 *      the "La gare, 9h — Louis arrives" class: voting the whole string at
 *      once either drags "arrives" into French scope (if the French clause
 *      dominates the ratio) or dilutes a real French violation elsewhere in
 *      the title below threshold (if the English clause dominates) —
 *      neither is right, because the two clauses are making two different,
 *      independent claims.
 *   3. Each clause (proper-name tokens dropped, `ENGLISH_CONNECTORS`
 *      tokens — "and"/"or"/"the"/"vs" — also dropped, since none has a
 *      French homograph and clause-splitting alone still leaves one glued
 *      onto a French-leaning remainder, e.g. "and monsieur, madame" after
 *      splitting "The escape phrase — and monsieur, madame" on the em
 *      dash) is scanned as French only if ≥60% of what's left is either a
 *      course-taught surface word or itself carries a French accented
 *      character — same 0.6 threshold `looksFrench` uses, reused for
 *      consistency, but voted PER TOKEN post-filtering rather than
 *      string-wide pre-filtering. An empty remainder (a clause that is
 *      nothing but a proper name, e.g. a hypothetical bare "Léa") scores 0
 *      tokens ⇒ not scanned — correct, a bare name is not a vocabulary
 *      claim.
 * FAILURE MODES (documented, not hidden):
 *   - FALSE NEGATIVE: an entirely-untaught, unaccented, no-guillemet French
 *     clause with fewer than 60% of its tokens resolving to the taught
 *     lexicon reads as "mostly English" and is skipped. Cheap to construct
 *     in theory (three obscure, atonal French words in a row); did not
 *     occur in the real m2–m20 corpus (verified by running this gate and
 *     manually spot-checking every title the classifier called English —
 *     see the FINAL REPORT).
 *   - FALSE NEGATIVE (by construction, in the fixes this gate's own first
 *     real run produced): an English word with no French homograph, glued
 *     onto a still-French-scoring clause, can be diluted below threshold
 *     by adding enough OTHER English padding rather than by translating
 *     the French words themselves — e.g. "Venir de + any verb" scores
 *     2 French hits («venir»/«de») over 4 tokens = 0.5 < 0.6, so the
 *     clause is never scanned and "any"/"verb" are never checked even
 *     though they sit next to real, taught French. This is deliberate and
 *     safe here ONLY because «venir»/«de» are independently confirmed
 *     taught by inspection when the fix was authored — the gate cannot
 *     itself detect a case where the diluted-away French half regresses
 *     to an untaught word later, since a passing clause is invisible to
 *     it. Noted for whoever next edits one of these titles: dilution is a
 *     valid ESCAPE from the check, not a taught-word substitute for it.
 *   - FALSE POSITIVE (residual, not fully closed): the tokenizer keeps a
 *     glued English possessive on a French name as ONE token per pin
 *     F4/F11's apostrophe-keeping rule — "Léa's" tokenizes to `"léa's"`,
 *     which does not exact-match `FR_PROPER_NAMES`'s `"léa"` entry, so it
 *     is NOT stripped by the proper-name filter and its accent still
 *     counts toward the French vote. In the real corpus this stays below
 *     the 0.6 threshold every time it occurs ("A friend of Léa's" scores
 *     1/3) and the title is correctly classified English — but a title
 *     that leaned harder on a possessive name ("Léa's café, Léa's book")
 *     could in principle tip over 0.6 and then have "léa's" itself flagged
 *     as an untaught token in the real check below (`ATOM_MODULE_NUM_BY_
 *     TOKEN` has no entry for the fused possessive form either). No FR
 *     title in the current corpus does this; flagged here for whoever
 *     authors the next one.
 *
 * TOKENIZER / REGISTRY: reuses `frTokens`, `FR_FUNCTION_WORDS`,
 * `FR_PROPER_NAMES`, `getFrRealFormLexicon` from `../__tests__/
 * moduleBarGuards` (the SAME tokenizer/allowlists/course-wide lexicon both
 * sibling gates and the per-module bar use — no second tokenizer, no second
 * lexicon) and `getFrCourseAtoms()` / `elidesBefore()` from `../courseAtoms`
 * (same as both siblings).
 *
 * `ATOM_MODULE_NUM_BY_TOKEN` below is, like `frDistractorProvenance.test.ts`'s
 * copy, a deliberate duplicate of `frSimProvenance.test.ts`'s identically-
 * bodied function (same reason: `getFrRealFormLexicon()` only answers
 * "ever taught", not "in which module", and a `.test.ts` file is not a
 * normal import target). It reuses exactly ONE of `frDistractorProvenance`'s
 * two documented divergences from the `frSimProvenance` baseline:
 *   - REUSED — apostrophe-fused carrier-atom STEM derivation (m3's «j'aime»
 *     registers bare «aime» at the SAME module): `frDistractorProvenance`'s
 *     own header calls this "a general correctness fix, not a
 *     distractor-only tolerance" and flags it as something
 *     `frSimProvenance`'s copy would also benefit from. A title is real
 *     content exposure exactly like a `dialogue_sim` turn, so the same
 *     "met the fused phrase ⇒ recognizes the bare stem" reasoning applies
 *     here unmodified.
 *   - NOT REUSED — the `isConsonantOnset` wrong-elision tolerance
 *     (`frDistractorProvenance`'s divergence 2). That tolerance exists
 *     ONLY because a wrong elision is sometimes the deliberate minimal-pair
 *     FOIL a distractor is built to be (m15's h-aspiré contrast). A title
 *     is never a foil — if a title ever contained a wrongly-elided
 *     consonant-onset word, that would be a real orthography defect to
 *     catch, not content to wave through. Porting it here would hide
 *     exactly the class of error this gate exists to find.
 *
 * EXEMPTIONS (course-wide, generic, same as both siblings):
 *   1. `FR_FUNCTION_WORDS` — closed-class function words/copulas.
 *   2. `FR_PROPER_NAMES` — course cast + place names.
 *   3. Multi-word carrier atoms need no separate exemption — component
 *      words are tokenized into the module map at atom-registration time.
 *   4. Digits: `frTokens` never matches a numeral.
 * No §13.6 tease / `FR_NPC_FORMULAS` exemption here — both are dialogue_sim
 * NPC-turn-only content-structure markers (frSimProvenance's domain); a
 * title is never an NPC line.
 *
 * EVERY new FR module must be added to `MODULES` below when it lands
 * (coordinator checklist — same as `frSimProvenance.test.ts` and
 * `frDistractorProvenance.test.ts`).
 */
import { describe, it, expect } from "vitest";
import type {
  DialogueSimStep,
  InfoStep,
  LessonContent,
} from "@/features/lesson/types";
import {
  frTokens,
  FR_FUNCTION_WORDS,
  FR_PROPER_NAMES,
  getFrRealFormLexicon,
} from "../__tests__/moduleBarGuards";
import { getFrCourseAtoms, elidesBefore } from "../courseAtoms";

import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_MODULE } from "./m7";
import { FR_M8_MODULE } from "./m8";
import { FR_M9_MODULE } from "./m9";
import { FR_M10_MODULE } from "./m10";
import { FR_M11_MODULE } from "./m11";
import { FR_M12_MODULE } from "./m12";
import { FR_M13_MODULE } from "./m13";
import { FR_M14_MODULE } from "./m14";
import { FR_M15_MODULE } from "./m15";
import { FR_M16_MODULE } from "./m16";
import { FR_M17_MODULE } from "./m17";
import { FR_M18_MODULE } from "./m18";
import { FR_M19_MODULE } from "./m19";
import { FR_M20_MODULE } from "./m20";

// ─── Module inventory (m2–m20; m1 is not in range, matches both siblings) ──

const MODULES: ReadonlyArray<{ id: string; n: number; lessons: LessonContent[] }> = [
  { id: "m2", n: 2, lessons: FR_M2_MODULE.lessons },
  { id: "m3", n: 3, lessons: FR_M3_MODULE.lessons },
  { id: "m4", n: 4, lessons: FR_M4_MODULE.lessons },
  { id: "m5", n: 5, lessons: FR_M5_MODULE.lessons },
  { id: "m6", n: 6, lessons: FR_M6_MODULE.lessons },
  { id: "m7", n: 7, lessons: FR_M7_MODULE.lessons },
  { id: "m8", n: 8, lessons: FR_M8_MODULE.lessons },
  { id: "m9", n: 9, lessons: FR_M9_MODULE.lessons },
  { id: "m10", n: 10, lessons: FR_M10_MODULE.lessons },
  { id: "m11", n: 11, lessons: FR_M11_MODULE.lessons },
  { id: "m12", n: 12, lessons: FR_M12_MODULE.lessons },
  { id: "m13", n: 13, lessons: FR_M13_MODULE.lessons },
  { id: "m14", n: 14, lessons: FR_M14_MODULE.lessons },
  { id: "m15", n: 15, lessons: FR_M15_MODULE.lessons },
  { id: "m16", n: 16, lessons: FR_M16_MODULE.lessons },
  { id: "m17", n: 17, lessons: FR_M17_MODULE.lessons },
  { id: "m18", n: 18, lessons: FR_M18_MODULE.lessons },
  { id: "m19", n: 19, lessons: FR_M19_MODULE.lessons },
  { id: "m20", n: 20, lessons: FR_M20_MODULE.lessons },
  // EVERY new FR module must be added here when it lands (coordinator checklist).
];

// ─── Token → earliest-teaching-module map (see file header: baseline from ──
// ─── frSimProvenance.test.ts + the ONE reused divergence from            ──
// ─── frDistractorProvenance.test.ts) ──────────────────────────────────────

function buildAtomModuleNumByToken(): Map<string, number> {
  const map = new Map<string, number>();
  const moduleNum = (m: string) => Number(m.replace(/^m/, ""));
  for (const a of getFrCourseAtoms()) {
    if (!a.fromModule) continue;
    const n = moduleNum(a.fromModule);
    const toks = frTokens(a.surface);
    for (const w of toks) {
      if (!map.has(w)) map.set(w, n);
      // Reused divergence (see file header) — apostrophe-fused carrier-atom
      // STEM derivation: a token like m3's "j'aime" also registers the bare
      // stem "aime" at the same module (frTokens keeps the elided clitic
      // glued to a FUSED phrase atom's surface as one token — pin F4/F11 —
      // so the bare stem never separately surfaces from that atom the way
      // it would from a space-separated carrier like "tu aimes").
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
    }
    // Deliberately NOT reused: frDistractorProvenance's isConsonantOnset
    // wrong-elision tolerance — see file header, "NOT REUSED".
  }
  return map;
}

const ATOM_MODULE_NUM_BY_TOKEN = buildAtomModuleNumByToken();

// ─── FR/English title classification (see file header for the full ────────
// ─── rationale and failure-mode writeup) ───────────────────────────────────

const FRENCH_ACCENT = /[àâæçéèêëîïôœùûüÿ]/;

/** A tiny closed set of English connector words with no French homograph
 *  (unlike "a", which coincides with the French verb form and must stay
 *  eligible for the vote) — these can turn up glued onto a French-leaning
 *  clause by the clause splitter itself ("and monsieur, madame" after
 *  splitting "The escape phrase — and monsieur, madame" on the em dash)
 *  and would otherwise both inflate the French-ratio vote AND, if the
 *  clause still crosses threshold on its OTHER tokens, get flagged as an
 *  "untaught French word" themselves. Stripped before both the vote and
 *  the token-provenance check (see `checkTitle`). Not a general English
 *  stopword list — deliberately minimal and unambiguous. */
const ENGLISH_CONNECTORS = new Set(["and", "or", "the", "vs"]);

/** Is this (guillemet-free) remainder of a title a French vocabulary claim,
 *  or just English framing that happens to sit next to one? See file header
 *  — proper names are stripped BEFORE the vote so an accented character
 *  arriving only via a course character's name ("Léa", "Chloé") cannot drag
 *  an all-English sentence into scope. */
function looksFrenchRemainder(text: string): boolean {
  const toks = frTokens(text).filter(
    (t) => !FR_PROPER_NAMES.has(t) && !ENGLISH_CONNECTORS.has(t),
  );
  if (toks.length === 0) return false;
  const lex = getFrRealFormLexicon(); // already includes FR_FUNCTION_WORDS
  const hits = toks.filter((t) => lex.has(t) || FRENCH_ACCENT.test(t)).length;
  return hits / toks.length >= 0.6;
}

/** Course-standard bilingual title separators: an em dash sets off an
 *  English gloss/description clause next to a French one ("La gare, 9h —
 *  Louis arrives"), a middle dot sets off the "✓ Checkpoint" chrome from
 *  its French topic ("✓ Checkpoint · La négation"), and " vs "/" or " frame
 *  a two-way contrast that is sometimes French-French (m20: "A mangé vs
 *  vient de manger") and sometimes French-English (m15: "Halle or hôtel?").
 *  Splitting on these BEFORE the French/English vote (rather than voting
 *  once over the whole title) keeps a mixed-language title's English half
 *  from either (a) being dragged into French scope by the French half's
 *  accents/lexicon hits, or (b) diluting the French half's ratio below
 *  threshold and hiding a real untaught word in it. */
const TITLE_CLAUSE_SPLIT = /\s+—\s+|\s+·\s+|\s+vs\s+|\s+or\s+/g;

/** The surface(s) of one title string this gate actually checks: every
 *  «guillemet»-quoted span (always — course convention, see header) plus
 *  each non-quoted clause (split on the bilingual separators above) that
 *  independently classifies as French. Returns `[]` for a title that is
 *  pure English framing — nothing to check. */
function titleSurfacesToScan(title: string): string[] {
  const out: string[] = [];
  for (const m of title.matchAll(/«([^»]+)»/g)) out.push(m[1]);
  const rest = title.replace(/«[^»]+»/g, " ");
  for (const clause of rest.split(TITLE_CLAUSE_SPLIT)) {
    if (looksFrenchRemainder(clause)) out.push(clause);
  }
  return out;
}

// ─── The gate ──────────────────────────────────────────────────────────────

type Hit = {
  moduleId: string;
  lessonId: string;
  stepId: string;
  token: string;
  surface: string;
  reason: string;
};

function checkTitle(
  moduleId: string,
  moduleN: number,
  lessonId: string,
  stepId: string,
  title: string,
  hits: Hit[],
): void {
  for (const surf of titleSurfacesToScan(title)) {
    for (const t of frTokens(surf)) {
      if (FR_FUNCTION_WORDS.has(t) || FR_PROPER_NAMES.has(t) || ENGLISH_CONNECTORS.has(t))
        continue;
      const taughtIn = ATOM_MODULE_NUM_BY_TOKEN.get(t);
      if (taughtIn === undefined) {
        hits.push({
          moduleId,
          lessonId,
          stepId,
          token: t,
          surface: title,
          reason: "never taught in any module",
        });
      } else if (taughtIn > moduleN) {
        hits.push({
          moduleId,
          lessonId,
          stepId,
          token: t,
          surface: title,
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
      checkTitle(mod.id, mod.n, lesson.id, "(lesson title)", lesson.title, hits);
      for (const step of lesson.steps) {
        if (step.type === "info") {
          const title = (step as InfoStep).title;
          if (title) checkTitle(mod.id, mod.n, lesson.id, step.id, title, hits);
        } else if (step.type === "dialogue_sim") {
          const title = (step as DialogueSimStep).scene.title;
          checkTitle(mod.id, mod.n, lesson.id, step.id, title, hits);
        }
      }
    }
  }
  return hits;
}

describe("FR title vocab provenance (m2–m20)", () => {
  it("every French token in every LessonContent.title / info.title / dialogue_sim scene.title resolves to an atom taught at or before this module", () => {
    const hits = walk();
    const fmt = hits.map(
      (h) =>
        `${h.moduleId}/${h.lessonId}/${h.stepId}: "${h.token}" (${h.reason}) — in "${h.surface.slice(0, 70)}"`,
    );
    expect(fmt).toEqual([]);
  });
});
