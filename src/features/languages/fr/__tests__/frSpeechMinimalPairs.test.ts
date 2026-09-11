/**
 * FR speech minimal-pair census gate (2026-09-10) — the COURSE-WIDE
 * follow-on the m19/m20 negated-frame probes named: `frSpeechNegatedFrames
 * .test.ts` hand-picked 14 `pas` targets and traced them against the real
 * fuzzy speech matcher (`scoreAlternativesGeneric`,
 * `src/shared/speech/loose-match.ts`); this file instead WALKS every
 * graded `speaking` step in the live FR modules m2–m26 (imported the way
 * `frSimProvenance.test.ts` does — no hardcoded lesson text), finds every
 * MINIMAL-PAIR relationship a speaking target has with (a) a sibling
 * speaking target in the same lesson/module or (b) a wrong-answer surface
 * the same lesson teaches as a contrast (MCQ/word-image-MCQ distractor,
 * particle_cloze option, build_sentence distractor tile), scores every
 * found pair with the real matcher, and FAILS when the sibling/wrong
 * hearing scores at or above the 0.55 "close" pass floor for a target it
 * is not. m21 was added at its review landing (2026-09-10); each new module
 * lands).
 *
 * MINIMAL-PAIR RULE (generic, defined once, here — no per-module cases):
 * tokenize both surfaces with `frTokens` (apostrophe-joined clitics kept
 * as one token, same tokenizer `moduleBarGuards.ts`'s provenance gate
 * uses), take the MULTISET symmetric difference, and call it a minimal
 * pair when that difference is
 *   (i)  a single token added or removed ("il parle" / "il parle pas"),
 *   or
 *   (ii) a single token SUBSTITUTED ("je mange" / "tu mange", "le chat" /
 *        "la chat[te]") —
 * i.e. "token-diff ≤ 1" read as: at most one token differs on each side.
 * Two identical surfaces (diff = 0) are not a pair — that is repetition,
 * not contrast. A diff of 3+ tokens, or a diff of exactly 2 non-short,
 * unrelated tokens (two different content words with no shared stem), is
 * NOT flagged — that is just two different sentences, not the "minimal"
 * contrast this gate is built to catch. Every flagged pair is additionally
 * labeled with a CONTRAST CLASS for the census/report only (does not
 * affect the pass/fail decision):
 *   - negation      — the differing token(s) are drawn from {ne, pas,
 *                      jamais, plus, rien}, or one side is the elided
 *                      "n'<verb>" form of the other's bare verb;
 *   - gender-number  — both differing tokens are articles (le/la/les/un/
 *                      une/des/du/au/aux), OR they share a stem and the
 *                      differing suffix is a bare gender/number ending
 *                      (e, s, es, x);
 *   - person         — both differing tokens are subject pronouns (je/tu/
 *                      il/elle/on/nous/vous/ils/elles);
 *   - preposition     — both differing tokens are prepositions (à/de/en/
 *                      au/du/aux/dans/sur/chez/vers/par/avec/pour/sans/
 *                      entre);
 *   - numeral         — both differing tokens are spelled-out numbers;
 *   - tense           — the differing tokens share a stem (≥3-char common
 *                      prefix, within 3 chars of the shorter token's
 *                      length) with a suffix that is NOT a bare gender/
 *                      number ending (mange/mangé/mangeais, visite/
 *                      visité);
 *   - short-token     — a catch-all for any other ≤1-token diff where the
 *                      differing token(s) are ≤4 letters (a short function
 *                      word not in any list above, e.g. "y"/"en").
 * A diff that fits none of the classes above (a single LONG,
 * unclassified content-word substitution — "chien" vs "chat", no shared
 * stem) is deliberately NOT flagged: that is ordinary vocabulary
 * contrast, not the padding-driven false-positive class the 2026-09-10
 * probes found.
 *
 * SOURCES WALKED (per task scope — no dialogue_sim reply options; that
 * surface is `frSimProvenance.test.ts`'s domain, a different question):
 *   - speaking targets:      `SpeakingStep.targetPhrase` where
 *                             `stubbed === false` (the FR `speaking()`
 *                             factory always emits `stubbed: false` — see
 *                             `grammarHelpers.ts` — so every FR speaking
 *                             step in this range is graded; the filter is
 *                             kept as a structural guard, not dead code);
 *   - MCQ distractor:         `MultipleChoiceStep.options[]` where
 *                             `id !== correctOptionId` — covers
 *                             `sentenceMcq()` (full-sentence distractors)
 *                             and `vocabTextMcq()` (gendered-noun
 *                             distractors);
 *   - word-image MCQ distractor: `WordImageMcqStep.options[].word` where
 *                             `id !== correctOptionId` (`vocabMcq()`);
 *   - cloze option:           `ParticleClozeStep.options[]` where
 *                             `!== correctParticle`;
 *   - build distractor tile:  `BuildSentenceStep.tiles` minus the
 *                             multiset of `correctOrder` (the tiles the
 *                             bank offers beyond what the answer uses).
 *
 * PAIRING SCOPE:
 *   (a) speaking × speaking — every unordered pair of graded speaking
 *       targets within the SAME MODULE (this subsumes same-lesson pairs;
 *       module is the wider of the two scopes the task names). Both
 *       directions are scored (target=A/hearing=B and target=B/hearing=A)
 *       — both are real graded checkpoints.
 *   (b) speaking × wrong-answer surface — every speaking target paired
 *       with every wrong-answer surface from the SAME LESSON only (the
 *       task's stated scope for this class — a distractor in a different
 *       lesson teaches nothing about THIS lesson's speaking check). Only
 *       the target→wrong-hearing direction is scored: the wrong surface
 *       is never itself a graded speaking target.
 *
 * CENSUS / RESULTS / KNOWN_LEGACY: see the module-level constants below
 * and `docs/fr-speech-minimal-pairs-2026-09-10.md` for the full counts,
 * worst offenders, and the follow-on list of step ids that should move to
 * build/cloze/MCQ.
 *
 * PROOF THE VERIFIER CAN FAIL (2026-09-10): planted a failure by deleting
 * one real entry from `KNOWN_LEGACY`
 * ("fr-m17-1-speak-onze::fr-m17-1-speak-douze") and ran `npx vitest run
 * frSpeechMinimalPairs` — the suite went RED, reporting exactly that pair
 * ("[numeral] m17 sibling — target fr-m17-1-speak-onze "onze" vs speaking
 * fr-m17-1-speak-douze "douze" → close (0.600)"), proving the assertion
 * is live against real scorer output, not vacuously `toEqual([])` against
 * an empty walk or a no-op allowlist check. Reverted from a saved backup
 * immediately after observing the failure; `diff` against the backup came
 * back clean (no residual edit) and the gate was re-run green before
 * moving on.
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";
import type {
  LessonContent,
  MultipleChoiceStep,
  WordImageMcqStep,
  ParticleClozeStep,
  BuildSentenceStep,
  SpeakingStep,
} from "@/features/lesson/types";
import { frTokens } from "./moduleBarGuards";
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
import { FR_M25_MODULE } from "../curriculum/m25";
import { FR_M26_MODULE } from "../curriculum/m26";

// ─── Module inventory (m2–m26; add each new module at landing) ────────────────

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
  { id: "m25", lessons: FR_M25_MODULE.lessons },
  { id: "m26", lessons: FR_M26_MODULE.lessons },
  // EVERY new FR module lands here when it ships (coordinator checklist,
  // mirrors frSimProvenance.test.ts's own inventory comment).
];

// ─── Minimal-pair classifier ────────────────────────────────────────────

const NEGATORS = new Set(["ne", "pas", "jamais", "plus", "rien"]);
const ARTICLES = new Set(["le", "la", "les", "un", "une", "des", "du", "au", "aux"]);
const PRONOUNS = new Set(["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"]);
const PREPOSITIONS = new Set([
  "à", "de", "en", "au", "du", "aux", "dans", "sur", "chez", "vers", "par",
  "avec", "pour", "sans", "entre",
]);
const NUMERALS = new Set([
  "un", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit",
  "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "vingt", "trente", "quarante", "cinquante", "soixante", "cent", "cents", "mille",
]);

type ContrastClass =
  | "negation"
  | "gender-number"
  | "person"
  | "preposition"
  | "numeral"
  | "tense"
  | "short-token";

/** Multiset symmetric difference: tokens only in `a`, tokens only in `b`. */
function multisetDiff(a: string[], b: string[]): { onlyA: string[]; onlyB: string[] } {
  const countA = new Map<string, number>();
  for (const t of a) countA.set(t, (countA.get(t) ?? 0) + 1);
  const countB = new Map<string, number>();
  for (const t of b) countB.set(t, (countB.get(t) ?? 0) + 1);
  const onlyA: string[] = [];
  for (const t of a) {
    const c = countB.get(t) ?? 0;
    if (c > 0) countB.set(t, c - 1);
    else onlyA.push(t);
  }
  const onlyB: string[] = [];
  for (const t of b) {
    const c = countA.get(t) ?? 0;
    if (c > 0) countA.set(t, c - 1);
    else onlyB.push(t);
  }
  return { onlyA, onlyB };
}

function commonPrefixLen(x: string, y: string): number {
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return i;
}

function classifyPair(x: string, y: string): ContrastClass | null {
  if (NEGATORS.has(x) && NEGATORS.has(y)) return "negation";
  if ((x.startsWith("n'") && x.slice(2) === y) || (y.startsWith("n'") && y.slice(2) === x)) {
    return "negation";
  }
  if (ARTICLES.has(x) && ARTICLES.has(y)) return "gender-number";
  if (PRONOUNS.has(x) && PRONOUNS.has(y)) return "person";
  if (PREPOSITIONS.has(x) && PREPOSITIONS.has(y)) return "preposition";
  if (NUMERALS.has(x) && NUMERALS.has(y)) return "numeral";
  const stem = commonPrefixLen(x, y);
  const shorter = Math.min(x.length, y.length);
  if (stem >= 3 && stem >= shorter - 3) {
    const sx = x.slice(stem);
    const sy = y.slice(stem);
    const bareGenderNumber = /^(e|s|es|x)?$/;
    if (bareGenderNumber.test(sx) && bareGenderNumber.test(sy)) return "gender-number";
    return "tense";
  }
  if (x.length <= 4 && y.length <= 4) return "short-token";
  return null;
}

function classifySingle(tok: string): ContrastClass | null {
  if (NEGATORS.has(tok)) return "negation";
  if (tok.length <= 4) return "short-token";
  return null;
}

/** The minimal-pair rule (see file header). Returns the contrast class, or
 *  null when `a`/`b` are identical or differ by more than the ≤1-token
 *  budget this gate cares about. */
function minimalPairClass(a: string, b: string): ContrastClass | null {
  const { onlyA, onlyB } = multisetDiff(frTokens(a), frTokens(b));
  const total = onlyA.length + onlyB.length;
  if (total === 0 || total > 2) return null;
  if (onlyA.length === 1 && onlyB.length === 0) return classifySingle(onlyA[0]);
  if (onlyB.length === 1 && onlyA.length === 0) return classifySingle(onlyB[0]);
  if (onlyA.length === 1 && onlyB.length === 1) return classifyPair(onlyA[0], onlyB[0]);
  return null;
}

// ─── Extraction ──────────────────────────────────────────────────────────

type SpeakingTarget = { moduleId: string; lessonId: string; stepId: string; text: string };
type WrongSurface = {
  moduleId: string;
  lessonId: string;
  stepId: string;
  stepType: string;
  text: string;
};

// `vocabMcq`/`vocabTextMcq` (grammarHelpers.ts) build MCQ option text by
// calling `withArticle(surface)` at CURRICULUM-MODULE IMPORT TIME. Under the
// vitest `curriculum` project (isolate:false, multi-worker, no forced file
// order), `courseAtoms.ts`'s eager `import.meta.glob` over `curriculum/m*.ts`
// resolves in a build-determined (not numerically sorted) order, so a
// module's own `vocabMcq()` calls can execute before an earlier module's
// `atom()` call has registered the noun they reference (e.g. m3's
// distractor "café", registered by m1). When that race loses, `withArticle`
// falls back to the bare surface ("café" instead of "le café"), and because
// each curriculum module's exported step data is a singleton computed once
// per worker, that bare text is permanently baked in for the rest of the
// run — changing this gate's token-diff classification (see
// docs/fr-speech-minimal-pairs-2026-09-10.md and the file header) for that
// option depending purely on which files vitest was given, not on any real
// content difference.
//
// Fix: don't trust the baked text. By the time `walk()` runs, every m2–m26
// module above has finished its static import, so the atom registry is
// guaranteed COMPLETE regardless of which order it was populated in.
// Re-derive the canonical article form here, at collection time, using the
// same `withArticle` rule against that now-complete registry. This is
// idempotent either way the race went: a race-bare "café" derives "le café"
// directly; an already-correct "le café" strips to "café" and re-derives
// "le café". Non-noun / unregistered text passes through unchanged
// (`withArticle` no-ops for it), so this only ever normalizes the specific
// text class the race can corrupt.
const ARTICLE_PREFIX_RE = /^(?:l['’]|les\s+|le\s+|la\s+|un\s+|une\s+|des\s+)(.+)$/i;

function canonicalizeArticle(text: string): string {
  const m = ARTICLE_PREFIX_RE.exec(text);
  const bare = m ? m[1] : text;
  return withArticle(bare);
}

function extractBuildDistractorTiles(step: BuildSentenceStep): string[] {
  const remaining = new Map<string, number>();
  for (const t of step.tiles) remaining.set(t, (remaining.get(t) ?? 0) + 1);
  for (const t of step.correctOrder) {
    const c = remaining.get(t) ?? 0;
    if (c > 0) remaining.set(t, c - 1);
  }
  const out: string[] = [];
  for (const [tile, count] of remaining) {
    for (let i = 0; i < count; i++) out.push(tile);
  }
  return out;
}

function collectModule(mod: { id: string; lessons: LessonContent[] }) {
  const speakingTargets: SpeakingTarget[] = [];
  const wrongSurfacesByLesson = new Map<string, WrongSurface[]>();
  for (const lesson of mod.lessons) {
    const wrongs: WrongSurface[] = [];
    for (const step of lesson.steps) {
      if (step.type === "speaking") {
        const s = step as SpeakingStep;
        if (s.stubbed === false && s.targetPhrase) {
          speakingTargets.push({
            moduleId: mod.id,
            lessonId: lesson.id,
            stepId: s.id,
            text: s.targetPhrase,
          });
        }
      } else if (step.type === "multiple_choice") {
        const s = step as MultipleChoiceStep;
        for (const o of s.options) {
          if (o.id !== s.correctOptionId && o.text) {
            wrongs.push({
              moduleId: mod.id,
              lessonId: lesson.id,
              stepId: s.id,
              stepType: "multiple_choice",
              text: canonicalizeArticle(o.text),
            });
          }
        }
      } else if (step.type === "word_image_mcq") {
        const s = step as WordImageMcqStep;
        for (const o of s.options) {
          if (o.id !== s.correctOptionId && o.word) {
            wrongs.push({
              moduleId: mod.id,
              lessonId: lesson.id,
              stepId: s.id,
              stepType: "word_image_mcq",
              text: canonicalizeArticle(o.word),
            });
          }
        }
      } else if (step.type === "particle_cloze") {
        const s = step as ParticleClozeStep;
        for (const o of s.options) {
          if (o !== s.correctParticle) {
            wrongs.push({
              moduleId: mod.id,
              lessonId: lesson.id,
              stepId: s.id,
              stepType: "particle_cloze",
              text: o,
            });
          }
        }
      } else if (step.type === "build_sentence") {
        const s = step as BuildSentenceStep;
        for (const t of extractBuildDistractorTiles(s)) {
          wrongs.push({
            moduleId: mod.id,
            lessonId: lesson.id,
            stepId: s.id,
            stepType: "build_sentence",
            text: t,
          });
        }
      }
    }
    wrongSurfacesByLesson.set(lesson.id, wrongs);
  }
  return { speakingTargets, wrongSurfacesByLesson };
}

// ─── Scoring ─────────────────────────────────────────────────────────────

function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

function score(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

type Violation = {
  key: string;
  kind: "sibling" | "wrong-answer";
  class: ContrastClass;
  moduleId: string;
  target: { lessonId: string; stepId: string; text: string };
  hearing: { lessonId: string; stepId: string; stepType: string; text: string };
  score: number;
  verdict: string;
};

function walk(): Violation[] {
  const violations: Violation[] = [];

  for (const mod of MODULES) {
    const { speakingTargets, wrongSurfacesByLesson } = collectModule(mod);

    // (a) speaking × speaking — same module (subsumes same-lesson).
    for (let i = 0; i < speakingTargets.length; i++) {
      for (let j = i + 1; j < speakingTargets.length; j++) {
        const a = speakingTargets[i];
        const b = speakingTargets[j];
        const cls = minimalPairClass(a.text, b.text);
        if (!cls) continue;
        for (const [target, hearing] of [
          [a, b],
          [b, a],
        ] as const) {
          const r = score(target.text, hearing.text);
          if (passed(r.verdict)) {
            violations.push({
              key: `${target.stepId}::${hearing.stepId}`,
              kind: "sibling",
              class: cls,
              moduleId: mod.id,
              target,
              hearing: { ...hearing, stepType: "speaking" },
              score: r.bestScore,
              verdict: r.verdict,
            });
          }
        }
      }
    }

    // (b) speaking × wrong-answer surface — same lesson only.
    for (const target of speakingTargets) {
      const wrongs = wrongSurfacesByLesson.get(target.lessonId) ?? [];
      for (const w of wrongs) {
        const cls = minimalPairClass(target.text, w.text);
        if (!cls) continue;
        const r = score(target.text, w.text);
        if (passed(r.verdict)) {
          violations.push({
            key: `${target.stepId}::${w.stepId}`,
            kind: "wrong-answer",
            class: cls,
            moduleId: mod.id,
            target,
            hearing: { lessonId: w.lessonId, stepId: w.stepId, stepType: w.stepType, text: w.text },
            score: r.bestScore,
            verdict: r.verdict,
          });
        }
      }
    }
  }

  return violations;
}

// ─── KNOWN_LEGACY (dated, SHRINK-ONLY — see docs/fr-speech-minimal-pairs-2026-09-10.md) ──

/**
 * Exact `${targetStepId}::${hearingStepId}` pairs that exist in m2–m26
 * today and score at/above the pass floor. This allowlist may only
 * shrink (an entry is removed once the pair is fixed — content edit or a
 * `speaking` step moved to build/cloze/MCQ) — never grown to admit a NEW
 * violation. `it("KNOWN_LEGACY has no stale entries", …)` below enforces
 * that every entry is still a real, currently-detected violation, so a
 * content fix that silently stops tripping the pair is caught (the entry
 * would need to be deleted here, not just left inert).
 */
const KNOWN_LEGACY = new Set<string>([
  // m2 — "m'appelle" (build distractor tile) vs "je m'appelle" (short-token)
  "fr-m2v2-2-speak-jemappelle::fr-m2v2-2-build-tappelles",
  // m3 — "le chat"/"un livre" vs unrelated 4-letter WIMCQ distractors
  // ("café", "livre") — coincidental short-token collisions, real matcher risk
  "fr-m3-1-speak-lechat::fr-m3-1-img-chat",
  "fr-m3-1-speak-lechat::fr-m3-1-img-chien",
  "fr-m3-2-speak-unlivre::fr-m3-2-img-pizza",
  "fr-m3-4-speak-lechat-recall::fr-m3-4-img-chocolat",
  "fr-m3-4-speak-lechat-recall::fr-m3-4-img-the",
  // m6 — "s'il vous plaît"/"s'il te plaît" (vous/te register pair) and
  // "un café"/"un thé" (noun swap inside the same order frame)
  "fr-m6-1-speak-fullorder::fr-m6-6-speak-the",
  "fr-m6-1-speak-svp-recall::fr-m6-10-speak-stp-recall",
  "fr-m6-1-speak-svp-recall::fr-m6-4-speak-stp",
  "fr-m6-1-speak-svp-recall::fr-m6-6-speak-stp-recall",
  "fr-m6-10-speak-stp-recall::fr-m6-1-speak-svp-recall",
  "fr-m6-4-speak-fullorder-recall::fr-m6-6-speak-the",
  "fr-m6-4-speak-stp::fr-m6-1-speak-svp-recall",
  "fr-m6-4-speak-stp::fr-m6-4-build-stp",
  "fr-m6-4-speak-stp::fr-m6-4-cloze-stp",
  "fr-m6-6-speak-stp-recall::fr-m6-1-speak-svp-recall",
  "fr-m6-6-speak-the::fr-m6-1-speak-fullorder",
  "fr-m6-6-speak-the::fr-m6-4-speak-fullorder-recall",
  // m7 — "mon chat"/"mon chien" vs unrelated short WIMCQ distractors
  "fr-m7-2-speak-monchat::fr-m7-2-hear-lasoeur",
  "fr-m7-7-speak-monchien-recall::fr-m7-7-hear-chat",
  // m11 — je/il/elle/tu person swaps on the shared "parle français" /
  // "aime parler français" / "habites à Paris" frames (conjugation checkpoint)
  "fr-m11-2-speak-ilparle::fr-m11-2-speak-jeparle",
  "fr-m11-2-speak-ilparle::fr-m11-5-speak-jeparle-recall",
  "fr-m11-2-speak-jeparle::fr-m11-2-speak-ilparle",
  "fr-m11-2-speak-jeparle::fr-m11-7-speak-ilparle-recall",
  "fr-m11-4-speak-ilaimeparler::fr-m11-6-speak-penpal",
  "fr-m11-5-speak-jeparle-recall::fr-m11-2-speak-ilparle",
  "fr-m11-5-speak-jeparle-recall::fr-m11-7-speak-ilparle-recall",
  "fr-m11-6-speak-penpal::fr-m11-4-speak-ilaimeparler",
  "fr-m11-6-speak-tuhabites-recall::fr-m11-6-smcq-ilhabite",
  "fr-m11-7-speak-ilparle-recall::fr-m11-2-speak-jeparle",
  "fr-m11-7-speak-ilparle-recall::fr-m11-5-speak-jeparle-recall",
  // m12 — "vingt" is a token-diff-1 prefix of every other vingt-* numeral
  // (short-token rule fires on the shared "vingt" stem)
  "fr-m12-1-speak-vingt::fr-m12-1-cloze-vingtetun",
  "fr-m12-1-speak-vingt::fr-m12-1-smcq-vingttrois",
  "fr-m12-10-speak-vingt-recall::fr-m12-10-smcq-recap",
  "fr-m12-2-speak-vingt-recall::fr-m12-2-build-quarantecinq",
  "fr-m12-2-speak-vingt-recall::fr-m12-2-smcq-trentesept",
  // m12 — "c'est cher" vs "c'est pas cher" negation drop
  "fr-m12-8-speak-cher-recall::fr-m12-8-smcq-1",
  // m13 — "je ne sais pas" vs "tu ne sais pas" (person), already the
  // frSpeechNegatedFrames census's own m13 finding class
  "fr-m13-1-speak-jenesaispas::fr-m13-1-smcq-jenesaispas",
  // m15 — "j'ai visité la halle hier" vs "j'ai déjà visité la halle"
  "fr-m15-2-speak-jaivisite::fr-m15-8-speak-jaidejavisite",
  "fr-m15-8-speak-jaidejavisite::fr-m15-2-speak-jaivisite",
  // m17 — the numeral row: onze/douze/treize/seize all pairwise token-diff-1
  "fr-m17-1-speak-douze::fr-m17-1-smcq-douze",
  "fr-m17-1-speak-douze::fr-m17-1-speak-onze",
  "fr-m17-1-speak-onze::fr-m17-1-cloze-onze",
  "fr-m17-1-speak-onze::fr-m17-1-speak-douze",
  "fr-m17-1-speak-onze::fr-m17-7-speak-douze-recall",
  "fr-m17-10-speak-seize-recall::fr-m17-10-cloze-douze",
  "fr-m17-10-speak-seize-recall::fr-m17-2-speak-treize",
  "fr-m17-2-speak-treize::fr-m17-10-speak-seize-recall",
  "fr-m17-2-speak-treize::fr-m17-3-speak-seize",
  "fr-m17-3-speak-seize::fr-m17-2-speak-treize",
  "fr-m17-7-speak-douze-recall::fr-m17-1-speak-onze",
  // m18 — jamais/rien/tu negator + person swaps on the shared "sais"/
  // "comprends" frames (already the class frSpeechNegation.test.ts traced
  // in isolation; this is the same finding reached by the census walk)
  "fr-m18-2-speak-saisjamais::fr-m18-4-speak-saisrien",
  "fr-m18-4-speak-saisrien::fr-m18-2-speak-saisjamais",
  "fr-m18-4-speak-saisrien::fr-m18-8-speak-tusaisrien",
  "fr-m18-4-speak-saisrien::fr-m18-9-speak-saisjamais-recall",
  "fr-m18-5-speak-comprendsrien::fr-m18-5-speak-tucomprendsrien",
  "fr-m18-5-speak-tucomprendsrien::fr-m18-5-speak-comprendsrien",
  "fr-m18-7-speak-rien-recall::fr-m18-7-smcq-moinonplus",
  "fr-m18-8-speak-tusaisrien::fr-m18-4-speak-saisrien",
  "fr-m18-9-speak-saisjamais-recall::fr-m18-4-speak-saisrien",
]);

describe("FR speech minimal-pair census (m2–m26, 2026-09-10)", () => {
  const violations = walk();

  it("KNOWN_LEGACY has no stale entries (shrink-only ratchet stays honest)", () => {
    const live = new Set(violations.map((v) => v.key));
    const stale = [...KNOWN_LEGACY].filter((k) => !live.has(k));
    expect(stale, `KNOWN_LEGACY entries no longer reproduced — delete them:\n  ${stale.join("\n  ")}`).toEqual([]);
  });

  it("no NEW minimal-pair false positive: a sibling/wrong hearing must not score >= close for a target it isn't", () => {
    const unlisted = violations.filter((v) => !KNOWN_LEGACY.has(v.key));
    const fmt = unlisted.map(
      (v) =>
        `[${v.class}] ${v.moduleId} ${v.kind} — target ${v.target.stepId} "${v.target.text}" ` +
        `vs ${v.hearing.stepType} ${v.hearing.stepId} "${v.hearing.text}" ` +
        `→ ${v.verdict} (${v.score.toFixed(3)})`,
    );
    expect(fmt).toEqual([]);
  });
});
