/**
 * Reusable per-module ES authoring-bar guards — the ES port of
 * `languages/ja/__tests__/moduleBarGuards.ts` (Track B of
 * docs/handoff-course-reauthoring-2026-08-19.md).
 *
 * The port follows docs/es-authoring-invariants-pinned.md, NOT the ja file:
 * roughly a third of the ja bar is scripts/particles/register machinery
 * Spanish does not have, and two ja rules INVERT here (E1: info/phrase_card
 * are ES intro devices; image-first is ja-only because the emoji art
 * pipeline is ja-only). What this file enforces, with its pin/invariant id:
 *
 *   - sentence-surface variety: no primary surface >3x per lesson (inv 24)
 *   - no full-sentence recognition MCQs in teaching lessons (inv 28 — the
 *     L8 mastery test, ES's test-out surface, is exempt)
 *   - production-framed prompts are never MCQs (inv 28/29)
 *   - plain prompts, no theatrics (inv 29)
 *   - no derived spot-the-mistake steps (inv 32 — retired course-wide)
 *   - vocab provenance: no untracked Spanish words; module-new words debut
 *     on intro-capable steps (inv 24/33 TEACH-FIRST; intro set per pin E11)
 *   - `translate` ≤15% of production steps (inv 43)
 *   - word_image_mcq is first-exposure only (inv 44)
 *   - particle_cloze options are taught atoms and the correct item belongs
 *     to THIS module (pin E2 — intro-only; past its module it is produced)
 *   - vosotros is never drilled (pin E3 — LatAm-neutral course)
 *   - MCQ distractor quality (inv 10 — shared Gate 5 core)
 *   - English-progressive gloss on Spanish simple present (pin E7 — the
 *     mirror image of ja's Gate 8: "hablo" glossed "I am speaking" primes
 *     estar+-ndo where there is none)
 *   - persona canon (inv 21), when a canon is supplied
 *
 * DEBT RATCHETS: m1–m16 predate this bar and violate parts of it. Per the
 * handoff's sequencing rule the violations are RATCHETED, not fixed inline —
 * each module test declares its measured debt and the re-author retires it.
 * Debt numbers are SHRINK-ONLY: never raise one to admit new content. A
 * module authored after 2026-08-19 declares no debt and gets the full bar.
 *
 * Measure mode: EMIT_ES_BAR_REPORT=1 writes per-module measured numbers to
 * /tmp/es-bar-report/<module>.json instead of the numbers living in
 * anyone's head.
 *
 * Call from the module's test file:
 *   registerEsModuleBarGuards({
 *     moduleLabel: "m17",
 *     lessons: ES_M17_LESSONS,
 *     priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m17")),
 *   });
 */
import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  lintMcqDistractorsCore,
  type DistractorLintFailure,
} from "@/shared/lessonAuthoring/mcqDistractorLint";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_VERB_ENTRIES } from "../conjugationTables";

// ─── Tokenization ────────────────────────────────────────────────────────

/** One Spanish word (accented Latin). Shared with the Gate 5 echo check. */
export const ES_WORD_TOKEN = /[a-záéíóúñü]+/gi;

export function esTokens(text: string): string[] {
  return (text.toLowerCase().match(ES_WORD_TOKEN) ?? []).filter((t) => t.length > 1);
}

/** Closed-class function words + m1–m2 chrome. Mirrors the comprehensibility
 *  gate's list (esPromptComprehensibility.test.ts) — kept separate because
 *  that gate measures PROMPT PROSE and this one measures TAUGHT SURFACES;
 *  their allowlists ratchet independently and must stay independently
 *  auditable. */
export const ES_FUNCTION_WORDS = new Set(
  (
    "el la los las un una unos unas lo al del " +
    "yo tú tu usted él ella ellos ellas nosotros nosotras ustedes " +
    "me te se le les nos mi mis su sus nuestro nuestra " +
    "de a en con por para sin sobre entre desde hasta " +
    "y e o u pero que si no sí ni como más menos muy también solo " +
    "qué quién quiénes cuál cuáles cómo dónde cuándo cuánto cuánta cuántos cuántas " +
    "es son está están soy eres hay ser estar " +
    "este esta esto ese esa eso aquí allí"
  ).split(/\s+/),
);

export const ES_PROPER_NAMES = new Set([
  "ana", "diego", "carlos", "maría", "maria", "sofía", "sofia", "luis",
  "elena", "pedro", "juan", "rosa", "miguel", "carmen", "lupita", "jorge",
  "marta",
  // The learner persona (sim-pass fix 2026-08-21): every sim reply speaks
  // as Sam, and checkpoint builds produce «me llamo Sam».
  "sam",
  "méxico", "mexico", "españa", "espana", "colombia", "perú", "peru",
  "dalia", "señor", "señora",
]);

const SPANISH_MARK = /[¿¡ñáéíóúü]/i;

function looksSpanish(text: string): boolean {
  if (SPANISH_MARK.test(text)) return true;
  // No orthographic mark → score tokens against the course lexicon. A
  // function-word count was tried first and failed both ways: "Yo quiero
  // agua." has only one function word, and a bare correct form like
  // "quiero" has none — the negative controls caught both.
  const toks = esTokens(text);
  if (toks.length === 0) return false;
  const lex = getEsRealFormLexicon();
  const hits = toks.filter((t) => lex.has(t) || ES_PROPER_NAMES.has(t)).length;
  return hits / toks.length >= 0.6;
}

// ─── The real-form lexicon (atoms + conjugation output) ─────────────────

let realFormLexicon: Set<string> | null = null;

/** Every real Spanish word the course knows: each word of every atom surface
 *  plus every conjugated form in ES_VERB_ENTRIES. The ES analogue of ja's
 *  getRealFormLexicon(). */
export function getEsRealFormLexicon(): Set<string> {
  if (realFormLexicon) return realFormLexicon;
  const lex = new Set<string>();
  for (const a of getEsCourseAtoms()) {
    for (const w of esTokens(a.surface)) lex.add(w);
  }
  for (const v of ES_VERB_ENTRIES) {
    for (const w of esTokens(v.lemma ?? "")) lex.add(w);
    for (const f of Object.values(v.forms ?? {})) {
      if (typeof f === "string") for (const w of esTokens(f)) lex.add(w);
    }
  }
  for (const w of ES_FUNCTION_WORDS) lex.add(w);
  lex.delete("");
  realFormLexicon = lex;
  return lex;
}

// ─── Plural canonicalization (the noun analogue of conjugation-aware PRIOR) ─
//
// m3 teaches plural formation; from then on a taught noun's REGULAR plural is
// a derived form of the singular, not a separate vocabulary item — "los
// libros" drills libro, exactly as "hablas" drills hablar. The provenance
// lint canonicalizes an otherwise-untracked plural token to its singular, so
// PRIOR/debut logic runs against the word that was actually taught. Tokens
// already in the lexicon are NEVER canonicalized (zero behavior change for
// them); irregular plurals stay untracked and must be registered or avoided.

/** Regular Spanish plural(s) of one word: vowel→+s, -z→-ces, -ón→-ones,
 *  final-s invariant (lunes), consonant→+es. */
function esRegularPlurals(word: string): string[] {
  if (word.length < 2) return [];
  if (/s$/.test(word)) return [word]; // invariant (lunes, gracias)
  if (/z$/.test(word)) return [`${word.slice(0, -1)}ces`];
  if (/ón$/.test(word)) return [`${word.slice(0, -2)}ones`];
  if (/[aeiouáéíóú]$/.test(word)) return [`${word}s`];
  return [`${word}es`];
}

// ─── Gender canonicalization (the adjective analogue of the plural canon) ─
//
// m4 teaches -o→-a adjective agreement; from then on a taught o-adjective's
// regular feminine (and its plural) is a derived form of the masculine atom,
// not a separate vocabulary item — "la casa es bonita" drills bonito exactly
// as "los libros" drills libro. Tokens already in the lexicon are NEVER
// canonicalized (registered feminines like mexicana keep their identity);
// irregular feminines (-or → -ora etc.) stay untracked and must be
// registered or avoided — same contract as irregular plurals below.
//
// Canon ONLY, never the real-form lexicon: VOCAB is that lexicon, so adding
// feminines there makes every «alta» a trackable word with no PRIOR — debut
// ratchets flipped in six modules when this was tried (2026-08-20). Plurals
// live outside the lexicon for the same reason.

let genderCanon: Map<string, string> | null = null;

/** feminine token (sg + pl) → masculine token, over -o adjective atom words. */
function getEsGenderCanon(): Map<string, string> {
  if (genderCanon) return genderCanon;
  const map = new Map<string, string>();
  for (const a of getEsCourseAtoms()) {
    if (a.partOfSpeech !== "adjective") continue;
    for (const w of esTokens(a.surface)) {
      if (!w.endsWith("o")) continue;
      const fem = `${w.slice(0, -1)}a`;
      if (!map.has(fem)) map.set(fem, w);
      if (!map.has(`${fem}s`)) map.set(`${fem}s`, w);
    }
  }
  genderCanon = map;
  return map;
}

let pluralCanon: Map<string, string> | null = null;

/** plural token → singular token, over noun/adjective atom surface words. */
function getEsPluralCanon(): Map<string, string> {
  if (pluralCanon) return pluralCanon;
  const map = new Map<string, string>();
  for (const a of getEsCourseAtoms()) {
    if (a.partOfSpeech !== "noun" && a.partOfSpeech !== "adjective") continue;
    for (const w of esTokens(a.surface)) {
      for (const p of esRegularPlurals(w)) {
        if (p !== w && !map.has(p)) map.set(p, w);
      }
    }
  }
  pluralCanon = map;
  return map;
}

// ─── Surface projection ──────────────────────────────────────────────────

/**
 * The Spanish surfaces a step actually EXPOSES the learner to — correct
 * answers, targets, transcripts, tiles, dialogue lines. Deliberately
 * EXCLUDED, with the reason:
 *   - multiple_choice / word_image_mcq / agreement_cloze DISTRACTORS: ES
 *     discrimination drills offer deliberately wrong forms («penso») — that
 *     is their pedagogy (the ja derivation-drill exemption, pin §0 inv 10);
 *   - prompts and explanations: prompt prose is the comprehensibility
 *     gate's domain; explanations render after the answer;
 *   - acceptedAnswers beyond [0]: grading-only variants (ja jaSurfaces
 *     scrub).
 * info bodies contribute only their «guillemet» spans — the house
 * convention for Spanish embedded in English rule prose.
 */
export function esSurfaces(step: LessonStep): string[] {
  const s = step as never as Record<string, unknown>;
  const out: string[] = [];
  switch (step.type) {
    case "phrase_card":
      out.push(String(s.kana ?? ""));
      break;
    case "build_sentence":
    case "listening_build":
      out.push(String(s.targetSentence ?? ""));
      for (const t of (s.tiles as string[]) ?? []) out.push(t);
      break;
    case "translate":
      out.push(((s.acceptedAnswers as string[]) ?? [])[0] ?? "");
      break;
    case "speaking":
      out.push(String(s.targetPhrase ?? ""));
      break;
    case "listening_comprehension":
      out.push(String(s.transcript ?? ""));
      break;
    case "particle_cloze": {
      const p = s.prompt as { before: string; after: string };
      out.push(p.before, p.after, String(s.correctParticle ?? ""));
      for (const o of (s.options as string[]) ?? []) out.push(o);
      break;
    }
    case "agreement_cloze": {
      // Reconstruct the FULL sentence: agreement drills blank a morpheme
      // ("viej" + blank "os"), and pushing segments separately manufactures
      // tokens no learner ever sees — "os" false-positived the vosotros ban
      // and "viej" the provenance gate until this joined them.
      const segs =
        (s.segments as Array<
          { text: string } | { blank: { correctAnswer: string } }
        >) ?? [];
      out.push(
        segs
          .map((seg) => ("text" in seg ? seg.text : seg.blank.correctAnswer))
          .join(""),
      );
      break;
    }
    case "match_pairs":
      for (const p of (s.pairs as Array<{ source: string }>) ?? []) out.push(p.source);
      break;
    case "word_image_mcq": {
      const options = (s.options as Array<{ id: string; word: string }>) ?? [];
      const correct = options.find((o) => o.id === s.correctOptionId)?.word;
      if (correct) out.push(correct);
      break;
    }
    case "multiple_choice": {
      const options = (s.options as Array<{ id: string; text: string }>) ?? [];
      const correct = options.find((o) => o.id === s.correctOptionId)?.text;
      if (correct && looksSpanish(correct)) out.push(correct);
      break;
    }
    case "dialogue_listen":
      for (const l of (s.lines as Array<{ kana: string }>) ?? []) out.push(l.kana);
      break;
    case "info": {
      const body = `${String(s.title ?? "")} ${String(s.body ?? "")}`;
      for (const m of body.matchAll(/«([^»]+)»/g)) out.push(m[1]);
      break;
    }
    default:
      break;
  }
  return out.filter(Boolean);
}

/** Intro-capable step types for ES (pin E11): a rule card, a passive
 *  phrase/vocab card (E1 — the ES intro device ja does not have), a picture
 *  MCQ, or a real first production/recognition act. NEVER a dialogue
 *  (inv 33 TEACH-FIRST), never a distractor. */
export const ES_INTRO_TYPES: ReadonlySet<string> = new Set([
  "info",
  "phrase_card",
  "word_image_mcq",
  "build_sentence",
  "speaking",
  "listening_comprehension",
]);

// ─── Pure lints (exported for the negative-control suite) ───────────────

export type EsBarFailure = { lessonId: string; stepId: string; problem: string };

/** Primary sentence surface used >3x in one lesson (inv 24). */
export function lintSentenceOveruse(lesson: LessonContent): EsBarFailure[] {
  const counts = new Map<string, number>();
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    // A cloze's audioText is CONFIRMATION audio for the solved sentence —
    // the step exercises its blank (buenos vs buenas), not the sentence
    // surface. Counting it broke the §13 first-encounter ramp
    // (map → hear → cloze-discrimination → speak) at exactly 4 (2026-08-21).
    if (st.type === "particle_cloze" || st.type === "agreement_cloze") continue;
    const surf =
      (st.targetSentence as string) ??
      (st.targetPhrase as string) ??
      (st.transcript as string) ??
      ((st.acceptedAnswers as string[]) ?? [])[0] ??
      (st.audioText as string);
    if (typeof surf !== "string" || !surf) continue;
    const norm = surf.toLowerCase().replace(/[¿¡?!.,\s]/g, "");
    if (norm.length < 8) continue; // single words repeat legitimately
    counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }
  const out: EsBarFailure[] = [];
  for (const [sentence, n] of counts) {
    if (n > 3) {
      out.push({
        lessonId: lesson.id,
        stepId: "-",
        problem: `primary surface "${sentence}" used ${n}x (max 3, inv 24)`,
      });
    }
  }
  return out;
}

/** Full-sentence recognition MCQ in a TEACHING lesson (inv 28). The correct
 *  option is a multi-word Spanish sentence — picking a built sentence is
 *  test-out material; teaching lessons build/translate/speak it. Near-
 *  minimal-pair discrimination drills (single-word options) pass. */
export function lintFullSentenceMcqs(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (st.type !== "multiple_choice") continue;
    const options = (st.options as Array<{ id: string; text: string }>) ?? [];
    const correct = options.find((o) => o.id === st.correctOptionId)?.text ?? "";
    const toks = esTokens(correct);
    const sentenceShaped = /[.!?]\s*$/.test(correct.trim()) || /^[¿¡]/.test(correct.trim());
    if (looksSpanish(correct) && toks.length >= 3 && (sentenceShaped || toks.length >= 4)) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem: `full-sentence recognition MCQ ("${correct}") — pick-the-built-sentence is test-out only; use build/translate/speaking (inv 28)`,
      });
    }
  }
  return out;
}

/** Production-framed prompt whose answer is a full sentence, on an MCQ
 *  (inv 28/29): "reply…", "say…", "how do you say…" must be a generation
 *  step. */
export function lintProductionFramedMcqs(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (st.type !== "multiple_choice") continue;
    const prompt = `${st.prompt ?? ""} ${st.question ?? ""}`;
    const options = (st.options as Array<{ id: string; text: string }>) ?? [];
    const correct = options.find((o) => o.id === st.correctOptionId)?.text ?? "";
    if (
      /\breply\b|\bsay\b|\brespond\b|\bhow (do|would) you\b|\btell (him|her|them)\b/i.test(
        prompt,
      ) &&
      /\s/.test(correct.trim())
    ) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem: `production-framed prompt with a full-sentence answer must be a build/translate/speaking step ("${prompt.trim().slice(0, 60)}…")`,
      });
    }
  }
  return out;
}

/** Theatrical production prompts (inv 29): a scenario with an internal
 *  sentence period. Plain only — "Build: <English>" / "What does this
 *  mean?". */
export function lintTheatricalPrompts(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    const isProd = st.type === "build_sentence" || st.type === "listening_build";
    const isLc = st.type === "listening_comprehension";
    if (!isProd && !isLc) continue;
    const prompt = String(st.prompt ?? st.question ?? "");
    if (/[.!?]\s+\S/.test(prompt.trim().replace(/[.!?]+$/, ""))) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem: `theatrical prompt ("${prompt}") — plain only; no scenario, no internal sentence period (inv 29)`,
      });
    }
  }
  return out;
}

/** Spot-the-mistake steps are retired course-wide (inv 32). */
export function lintSpotTheMistake(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (String(st.id ?? "").endsWith("-spot")) {
      out.push({ lessonId: lesson.id, stepId: String(st.id), problem: "spot-the-mistake step is retired (inv 32)" });
    }
    if (/one of these is wrong/i.test(String(st.prompt ?? ""))) {
      out.push({ lessonId: lesson.id, stepId: String(st.id), problem: '"one of these is wrong" prompt is retired (inv 32)' });
    }
  }
  return out;
}

/** vosotros is never drilled (pin E3): no Spanish surface carries vosotros,
 *  the os clitic, or a -áis/-éis ending. Data-level completeness (the
 *  conjugation TABLES may carry vosotros, flagged Spain-only) is exempt —
 *  this reads only what lessons expose. */
// Number words ending in -séis are NOT verb endings — without this the
// regex flags dieciséis/veintiséis (m5/m6 numbers).
const VOSOTROS_FALSE_FRIENDS = new Set(["seis", "dieciséis", "veintiséis"]);

export function lintVosotros(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const step of lesson.steps) {
    for (const surf of esSurfaces(step)) {
      for (const tok of esTokens(surf)) {
        const isVosotrosForm =
          tok === "vosotros" ||
          tok === "vosotras" ||
          tok === "os" ||
          (/[áé]is$/.test(tok) && !VOSOTROS_FALSE_FRIENDS.has(tok));
        if (isVosotrosForm) {
          out.push({
            lessonId: lesson.id,
            stepId: step.id,
            problem: `vosotros form "${tok}" exposed ("${surf}") — the course is LatAm-neutral; ustedes covers 2pl (pin E3)`,
          });
        }
      }
    }
  }
  return out;
}

/** English progressive gloss on a Spanish simple present (pin E7 — ja Gate 8
 *  mirrored): listening_comprehension whose transcript has no estar+-ndo and
 *  no licensing time frame must not gloss with "am/are/is …ing". */
const ES_PROGRESSIVE = /\best(oy|ás|á|amos|án)\s+\w+[aiy]?[e]?ndo\b/i;
const ES_PROGRESSIVE_LICENSE =
  /\b(ahora|hoy|mañana|esta (noche|tarde|semana)|este (fin|año|mes)|ya|todavía)\b/i;
const EN_PROGRESSIVE = /\b(am|are|is)\s+\w+ing\b/i;

export function lintProgressiveGloss(lesson: LessonContent): EsBarFailure[] {
  const out: EsBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (st.type !== "listening_comprehension") continue;
    const es = String(st.transcript ?? "");
    if (!es) continue;
    if (ES_PROGRESSIVE.test(es)) continue;
    if (ES_PROGRESSIVE_LICENSE.test(es)) continue;
    const options = (st.options as Array<{ id: string; text: string }>) ?? [];
    const correct = options.find((o) => o.id === st.correctOptionId)?.text ?? "";
    if (EN_PROGRESSIVE.test(correct)) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem:
          `"${es}" is simple present with no estar+-ndo and no licensing time frame, but the gloss "${correct}" ` +
          "uses an English progressive — primes the learner to expect estar + gerundio (pin E7)",
      });
    }
  }
  return out;
}

// ─── Registration ────────────────────────────────────────────────────────

export type EsBarDebt = {
  /** Untracked Spanish word OCCURRENCES across the module's surfaces. */
  unknownTokens?: number;
  /** Module-new words whose first exposure is a non-intro step type. */
  nonIntroDebuts?: number;
  /** inv 28 full-sentence recognition MCQs in teaching lessons. */
  fullSentenceMcqs?: number;
  /** inv 28/29 production-framed MCQ prompts. */
  productionFramedMcqs?: number;
  /** inv 43 — measured translate share when it exceeds the 0.15 cap. */
  translateShare?: number;
  /** Gate 5 distractor-lint failures. */
  distractorLint?: number;
  /** inv 29 theatrical prompts. */
  theatricalPrompts?: number;
  /** pin E7 progressive glosses. */
  progressiveGlosses?: number;
  /** inv 24 primary-surface overuse. */
  sentenceOveruse?: number;
  /** inv 44 word_image_mcq on an already-known word. */
  imageMcqReuse?: number;
  /** pin E2 particle_cloze whose correct item is a prior module's. */
  particleClozeOutOfModule?: number;
};

export function registerEsModuleBarGuards(opts: {
  moduleLabel: string;
  lessons: LessonContent[];
  /** Modules whose atoms count as already-known, e.g. ES_MODULE_ORDER up to
   *  (excluding) this module. */
  priorModules: string[];
  /** inv 21 — named-character facts. Optional until the re-author fixes the
   *  ES cast; the mechanism is here so the canon lands as data, not code. */
  canon?: Record<string, Set<string>>;
  /** SHRINK-ONLY debt, measured 2026-08-19. The re-author retires it; never
   *  raise a number to admit new content. Omit entirely for new modules. */
  debt?: EsBarDebt;
}): void {
  const { moduleLabel, lessons, priorModules } = opts;
  const debt = opts.debt ?? {};
  const priorSet = new Set(priorModules);
  const moduleId = moduleLabel.match(/m\d+/)?.[0] ?? moduleLabel;

  const VOCAB = getEsRealFormLexicon();

  // Already-known words: prior modules' atom surfaces (tag-based — ES
  // fromModule tags are where the word is taught today; the JA
  // HIDE-THE-OLD-COURSE priorLessons mode becomes necessary only if a
  // re-author leaves stale tags behind, which the IR re-author does not:
  // it re-registers atoms per module).
  const PRIOR = new Set<string>();
  const atomModuleBySurfaceWord = new Map<string, string>();
  for (const a of getEsCourseAtoms()) {
    for (const w of esTokens(a.surface)) {
      if (!atomModuleBySurfaceWord.has(w)) {
        atomModuleBySurfaceWord.set(w, a.fromModule ?? "");
      }
      if (a.fromModule && priorSet.has(a.fromModule)) PRIOR.add(w);
    }
  }
  // Conjugation-aware PRIOR (JA trap #3 — the provenance lexicon must know
  // conjugation from day one): PRESENT-tense forms belong to the module that
  // introduced the verb — the paradigm is the teaching unit — so a prior
  // verb's present forms are review, not untaught debuts (m17 drilling
  // "hablas" is m8 material). Preterite/imperfect forms are deliberately NOT
  // expanded: their own modules teach them and register the taught forms as
  // atoms, which the atom loop above already covers. vosotros cells are
  // skipped — they are data-completeness only (pin E3).
  const curNum = Number(moduleId.slice(1));
  if (Number.isFinite(curNum)) {
    for (const v of ES_VERB_ENTRIES) {
      if (!(v.introducedAtModule < curNum)) continue;
      for (const [formKey, form] of Object.entries(v.forms ?? {})) {
        if (!formKey.startsWith("present.") || formKey === "present.vosotros") continue;
        for (const w of esTokens(form)) PRIOR.add(w);
      }
    }
  }

  const report: Record<string, unknown> = {};
  const emit = process.env.EMIT_ES_BAR_REPORT === "1";
  const ratchet = (
    name: keyof EsBarDebt,
    failures: EsBarFailure[] | string[],
    opts2?: { unit?: string },
  ) => {
    const allowed = (debt[name] as number | undefined) ?? 0;
    const lines = failures.map((f) =>
      typeof f === "string" ? f : `${f.lessonId}/${f.stepId}: ${f.problem}`,
    );
    report[name] = { measured: failures.length, allowed, worst: lines.slice(0, 10) };
    expect(
      failures.length,
      `${moduleLabel} ${String(name)}: ${failures.length} ${opts2?.unit ?? "violations"} > declared debt ${allowed} (SHRINK-ONLY — fix content, never raise the number):\n  ${lines.slice(0, 15).join("\n  ")}`,
    ).toBeLessThanOrEqual(allowed);
  };

  describe(`ES ${moduleLabel} authoring bar`, () => {
    it("no primary sentence surface repeats more than 3x per lesson (inv 24)", () => {
      ratchet("sentenceOveruse", lessons.flatMap(lintSentenceOveruse));
    });

    it("no full-sentence recognition MCQs in teaching lessons (inv 28)", () => {
      // The mastery test-out is the FINAL lesson (L8 in the July wave, L9/L10
      // in the §13 modules) — derived, not hardcoded.
      const masteryId = lessons[lessons.length - 1]?.id;
      const teaching = lessons.filter((l) => l.id !== masteryId);
      ratchet("fullSentenceMcqs", teaching.flatMap(lintFullSentenceMcqs));
    });

    it("production-framed prompts are generation steps, not MCQs (inv 28/29)", () => {
      ratchet("productionFramedMcqs", lessons.flatMap(lintProductionFramedMcqs));
    });

    it("production prompts are plain, no theatrics (inv 29)", () => {
      ratchet("theatricalPrompts", lessons.flatMap(lintTheatricalPrompts));
    });

    it("no derived spot-the-mistake step (inv 32 — retired)", () => {
      const failures = lessons.flatMap(lintSpotTheMistake);
      expect(failures.map((f) => `${f.lessonId}/${f.stepId}: ${f.problem}`)).toEqual([]);
    });

    it("vosotros is never drilled (pin E3)", () => {
      const failures = lessons.flatMap(lintVosotros);
      expect(failures.map((f) => `${f.lessonId}/${f.stepId}: ${f.problem}`)).toEqual([]);
    });

    it("GATE 5 — MCQ distractor quality (inv 10)", () => {
      const failures: DistractorLintFailure[] = lessons.flatMap((l) =>
        lintMcqDistractorsCore(l, {
          wordToken: /[a-záéíóúñü]{3,}/i,
          echoMinLength: 3,
          realFormLexicon: getEsRealFormLexicon(),
          isMeaningCuedFormPicker: (prompt) =>
            /\bform\b/i.test(prompt) && !SPANISH_MARK.test(prompt),
          // ES derivation-drill exemption: a conjugation picker ("Pick the
          // yo preterite of hablar.") legitimately offers the quoted lemma
          // unchanged — the didn't-conjugate error mode. Only the infinitive
          // itself is exempt, only on form-cued prompts.
          allowEchoDistractor: ({ prompt, distractor }) =>
            /\b(preterite|imperfect|present|form|conjugat)/i.test(prompt) &&
            /(?:ar|er|ir)$/.test(distractor.trim().toLowerCase()),
        }),
      );
      ratchet("distractorLint", failures as never as EsBarFailure[]);
    });

    it("Spanish simple present is not glossed with an English progressive (pin E7)", () => {
      ratchet("progressiveGlosses", lessons.flatMap(lintProgressiveGloss));
    });

    it("translate stays ≤15% of production steps (inv 43)", () => {
      const prod = lessons.flatMap((l) =>
        l.steps.filter((s) =>
          ["build_sentence", "translate", "listening_build", "speaking"].includes(s.type),
        ),
      );
      const translate = prod.filter((s) => s.type === "translate").length;
      const share = prod.length ? translate / prod.length : 0;
      const cap = debt.translateShare ?? 0.15;
      report.translateShare = { measured: share, allowed: cap, translate, production: prod.length };
      expect(
        share,
        `${moduleLabel}: translate is ${translate}/${prod.length} = ${share.toFixed(3)} of production ` +
          `(cap ${cap} — inv 43: typed translation is the most fatiguing step; production belongs to build/speaking)`,
      ).toBeLessThanOrEqual(cap + 1e-9);
    });

    it("word_image_mcq is first-exposure only (inv 44)", () => {
      // "First exposure" is judged at LESSON granularity: the canonical ES
      // teach sequence (E1/E11) is phrase_card intro → image MCQ retrieval a
      // couple of steps later IN THE SAME LESSON, so same-lesson prior
      // exposure is fine. What inv 44 bans is the image MCQ as a REVIEW
      // device — drilling a word taught in an earlier lesson or module.
      const failures: EsBarFailure[] = [];
      const seen = new Set<string>(PRIOR);
      for (const lesson of lessons) {
        const knownAtLessonStart = new Set(seen);
        for (const step of lesson.steps) {
          if (step.type === "word_image_mcq") {
            const s = step as never as Record<string, unknown>;
            const options = (s.options as Array<{ id: string; word: string }>) ?? [];
            const correct = options.find((o) => o.id === s.correctOptionId)?.word ?? "";
            // AUDIO-PROMPTED mode (an option's word IS the meaning side, so
            // the prompt is the Spanish clip): §13's zero-reading retrieval
            // beat, allowed on known words anywhere — the doctrine pins ≥6
            // per module. inv 44 bans only ENGLISH-prompted reuse, where the
            // picture answers the question (2026-08-21).
            const audioPrompted = options.some((o) => o.word === (s.meaningEn as string));
            const toks = esTokens(correct);
            if (!audioPrompted && toks.some((t) => knownAtLessonStart.has(t))) {
              failures.push({
                lessonId: lesson.id,
                stepId: step.id,
                problem: `word_image_mcq on already-known "${correct}" — the type is first-exposure only (inv 44); review retrieval belongs to match/build/cloze`,
              });
            }
          }
          for (const surf of esSurfaces(step)) {
            for (const t of esTokens(surf)) seen.add(t);
          }
        }
      }
      ratchet("imageMcqReuse", failures);
    });

    it("particle_cloze items belong to this module (pin E2 — intro-only)", () => {
      const failures: EsBarFailure[] = [];
      for (const lesson of lessons) {
        for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
          if (step.type !== "particle_cloze") continue;
          const correct = String(step.correctParticle ?? "");
          const fm = atomModuleBySurfaceWord.get(correct.toLowerCase());
          // §13.9 law 5 exemption (2026-08-21): an ALTERNATING-ANSWER
          // discrimination trial — exactly two options, both taught, sharing
          // a stem (buenos/buenas, maestro/maestra) — is a pick BY DESIGN
          // and its tail lane is spaced across modules. E2 still bans
          // generic recognition picks of old particles (de/y/o…).
          const options = ((step.options as string[]) ?? []).map((o) => o.toLowerCase());
          const isDiscriminationTrial =
            options.length === 2 &&
            options.every((o) => atomModuleBySurfaceWord.has(o)) &&
            options[0] !== options[1];
          if (isDiscriminationTrial) continue;
          if (fm && fm !== moduleId) {
            failures.push({
              lessonId: lesson.id,
              stepId: String(step.id),
              problem: `particle_cloze on "${correct}" (taught ${fm}) — past its intro module the item is PRODUCED, not picked (pin E2)`,
            });
          }
        }
      }
      ratchet("particleClozeOutOfModule", failures);
    });

    it("vocab provenance: no untracked words; module-new words debut on intro-capable steps (inv 24/33)", () => {
      const unknown: string[] = [];
      const canonOf = getEsPluralCanon();
      const genderOf = getEsGenderCanon();
      const firstSeen = new Map<string, { type: string; stepId: string; lessonId: string }>();
      for (const lesson of lessons) {
        for (const step of lesson.steps) {
          for (const surf of esSurfaces(step)) {
            for (const raw of esTokens(surf)) {
              // A token the lexicon already knows keeps its own identity;
              // only otherwise-untracked regular plurals fold into their
              // singular (los libros drills libro) and untracked regular
              // feminines of -o adjectives into their masculine (la casa es
              // bonita drills bonito).
              const t = VOCAB.has(raw)
                ? raw
                : (canonOf.get(raw) ?? genderOf.get(raw) ?? raw);
              if (ES_FUNCTION_WORDS.has(t) || ES_PROPER_NAMES.has(t)) continue;
              if (!VOCAB.has(t)) {
                unknown.push(`untracked word "${raw}" in ${lesson.id}/${step.id} ("${surf.slice(0, 50)}")`);
                continue;
              }
              if (PRIOR.has(t)) continue;
              if (!firstSeen.has(t)) {
                firstSeen.set(t, { type: step.type, stepId: step.id, lessonId: lesson.id });
              }
            }
          }
        }
      }
      const nonIntro: string[] = [];
      for (const [word, first] of firstSeen) {
        if (!ES_INTRO_TYPES.has(first.type)) {
          nonIntro.push(
            `"${word}" debuts on non-intro step type ${first.type} (${first.lessonId}/${first.stepId})` +
              (first.type === "dialogue_listen"
                ? " — TEACH-FIRST (inv 33): a dialogue can't be a word's first exposure"
                : ""),
          );
        }
      }
      // Record BOTH measurements in the report before either assertion can
      // abort the it() — the first EMIT pass lost every module's
      // nonIntroDebuts number this way.
      const allowedUnknown = debt.unknownTokens ?? 0;
      const allowedNonIntro = debt.nonIntroDebuts ?? 0;
      report.unknownTokens = {
        measured: unknown.length,
        allowed: allowedUnknown,
        worst: unknown.slice(0, 10),
      };
      report.nonIntroDebuts = {
        measured: nonIntro.length,
        allowed: allowedNonIntro,
        worst: nonIntro.slice(0, 10),
      };
      expect(
        unknown.length,
        `${moduleLabel} unknownTokens: ${unknown.length} untracked-word occurrences > declared debt ${allowedUnknown} (SHRINK-ONLY):\n  ${unknown.slice(0, 15).join("\n  ")}`,
      ).toBeLessThanOrEqual(allowedUnknown);
      expect(
        nonIntro.length,
        `${moduleLabel} nonIntroDebuts: ${nonIntro.length} non-intro debuts > declared debt ${allowedNonIntro} (SHRINK-ONLY):\n  ${nonIntro.slice(0, 15).join("\n  ")}`,
      ).toBeLessThanOrEqual(allowedNonIntro);
    });

    if (opts.canon && Object.keys(opts.canon).length > 0) {
      it("persona canon is consistent module-wide (inv 21)", () => {
        const canon = opts.canon!;
        const names = Object.keys(canon).join("|");
        const preds = [...new Set(Object.values(canon).flatMap((s) => [...s]))].join("|");
        const re = new RegExp(`\\b(${names}) es (${preds})\\b`, "g");
        for (const lesson of lessons) {
          const blob = JSON.stringify(lesson.steps);
          for (const m of blob.matchAll(re)) {
            expect(
              canon[m[1]].has(m[2]),
              `${lesson.id}: "${m[0]}" contradicts persona canon`,
            ).toBe(true);
          }
        }
      });
    }

    if (emit) {
      it("EMIT_ES_BAR_REPORT", () => {
        const dir = process.env.EMIT_ES_BAR_REPORT_DIR ?? "/tmp/es-bar-report";
        mkdirSync(dir, { recursive: true });
        writeFileSync(`${dir}/${moduleId}.json`, JSON.stringify(report, null, 1));
      });
    }
  });
}
