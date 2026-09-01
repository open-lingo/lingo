/**
 * Reusable per-module FR authoring-bar guards — the FR port of
 * `es/__tests__/moduleBarGuards.ts`, which is itself the ES port of the JA
 * bar (Track B, docs/handoff-course-reauthoring-2026-08-19.md). Pin ids
 * below are docs/fr-authoring-invariants-pinned.md (F*) and the ES
 * invariants FR adopts wholesale via F13 (follow the ES module standard).
 *
 * NO DEBT PARAMETER, BY DESIGN. ES/JA carry shrink-only debt ratchets
 * because pre-gate content existed before the bar did; French has no
 * pre-gate content — the gates landed before the first module — so every
 * check here is a hard zero and the type system offers no way to pin an
 * exception. If a module cannot pass, fix the module.
 *
 * Differences from the ES bar, each deliberate:
 *   - tokenizer keeps APOSTROPHES inside tokens («s'il», «l'ami», «j'ai»
 *     are single lexical items — pin F4/F11);
 *   - no vosotros analogue: FR has no banned pronoun row (F9 governs
 *     tu/vous REGISTER pairing, checked as content, not as a lint);
 *   - no progressive-gloss lint: ES pin E7 exists because Spanish HAS
 *     estar+gerundio to mis-prime; French has no progressive — «je parle»
 *     glossed "I am speaking" is correct French-to-English, not a trap;
 *   - full-sentence-MCQ lint exempts registered ATOM surfaces: French
 *     fixed phrases («s'il vous plaît», «ça va») are single vocabulary
 *     items that legitimately appear as recognition options;
 *   - no plural canonicalization yet — no FR module teaches plural
 *     formation; the noun-plural module ports the ES canon when it lands
 *     (and French plurals are mostly SILENT, so the canon will need the
 *     homophone machinery, not just spelling rules);
 *   - no conjugation-aware PRIOR yet — no FR conjugation tables exist;
 *     the first verb module ports the ES expansion.
 *
 * Call from the module's test file:
 *   registerFrModuleBarGuards({
 *     moduleLabel: "m1",
 *     lessons: FR_M1_MODULE.lessons,
 *     priorModules: [],   // modules earlier in the pathway
 *   });
 */
import { describe, it, expect } from "vitest";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  lintMcqDistractorsCore,
  type DistractorLintFailure,
} from "@/shared/lessonAuthoring/mcqDistractorLint";
import { elidesBefore, getFrCourseAtoms } from "../courseAtoms";

// ─── Tokenization ────────────────────────────────────────────────────────

/** One French word: accented Latin, with apostrophe-joined clitics kept as
 *  one token («s'il», «l'ami») — splitting them manufactures fragments no
 *  learner sees. Curly apostrophes are normalized before matching. */
export const FR_WORD_TOKEN =
  /[a-zàâæçéèêëîïôœùûüÿ]+(?:'[a-zàâæçéèêëîïôœùûüÿ]+)*/gi;

export function frTokens(text: string): string[] {
  return (text.toLowerCase().replace(/[’ʼ]/g, "'").match(FR_WORD_TOKEN) ?? [])
    .filter((t) => t.length > 1);
}

/** Closed-class function words + copulas a learner meets as sentence chrome.
 *  Deliberately NO content verbs/nouns — those must be taught atoms. */
export const FR_FUNCTION_WORDS = new Set(
  (
    "le la les l'un l'une un une des de du d'un d'une au aux à en dans sur " +
    "sous chez avec pour sans entre vers par " +
    "je tu il elle on nous vous ils elles moi toi lui eux " +
    "me te se ne pas plus jamais rien y " +
    "mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs " +
    "et ou mais donc car ni que qui quoi dont où si " +
    "quand comment pourquoi combien quel quelle quels quelles " +
    "ce cet cette ces c'est n'est est sont suis es êtes sommes " +
    "oui non très aussi bien voici voilà " +
    "monsieur madame mademoiselle"
  ).split(/\s+/),
);

/** Course cast + names used in carriers. */
export const FR_PROPER_NAMES = new Set([
  "marie", "thomas", "léa", "lea", "hugo", "camille", "lucas", "chloé",
  "chloe", "paul", "emma", "louis",
  "paris", "france", "québec", "quebec", "lyon", "montréal", "montreal",
  // The learner persona + hometown (sim-pass fix 2026-08-21).
  "sam", "new", "york", "inès", "ines",
]);

/** French orthographic fingerprint. «» are included: the course quotes
 *  French — and only French — in guillemets. */
const FRENCH_MARK = /[àâæçéèêëîïôœùûüÿ«»]/i;

function looksFrench(text: string): boolean {
  if (FRENCH_MARK.test(text)) return true;
  // No mark → score tokens against the course lexicon (unaccented French
  // like "salut" or "bonjour" carries no orthographic fingerprint).
  const toks = frTokens(text);
  if (toks.length === 0) return false;
  const lex = getFrRealFormLexicon();
  const hits = toks.filter((t) => lex.has(t) || FR_PROPER_NAMES.has(t)).length;
  return hits / toks.length >= 0.6;
}

// ─── The real-form lexicon ───────────────────────────────────────────────

let realFormLexicon: Set<string> | null = null;

/** Every real French word the course knows: each word of every atom
 *  surface plus the function-word chrome. Conjugation output joins here
 *  when the first FR verb module lands its tables. */
export function getFrRealFormLexicon(): Set<string> {
  if (realFormLexicon) return realFormLexicon;
  const lex = new Set<string>();
  for (const a of getFrCourseAtoms()) {
    for (const w of frTokens(a.surface)) lex.add(w);
    // §13.4/F2 (fr m4, 2026-09-01 — the first vowel-initial nouns): a
    // vowel-onset atom SURFACES elided («l'école»), and the tokenizer
    // rightly keeps the clitic attached, so the elided token must be a
    // known word. Derive it through the ONE elision source rather than
    // registering elided duplicates as atoms.
    if (elidesBefore(a)) {
      const first = frTokens(a.surface)[0];
      if (first) lex.add(`l'${first}`);
    }
  }
  for (const w of FR_FUNCTION_WORDS) lex.add(w);
  lex.delete("");
  realFormLexicon = lex;
  return lex;
}

// ─── Surface projection ──────────────────────────────────────────────────

/**
 * The French surfaces a step actually EXPOSES the learner to. Exclusions
 * mirror the ES projection (distractors are discrimination pedagogy;
 * prompts are the comprehensibility gate's domain; acceptedAnswers beyond
 * [0] are grading leniency). FR additions:
 *   - silent_letter exposes its written word (graphemes joined) + audio
 *     text — orthography drills are exposures of the word drilled;
 *   - liaison_listen exposes its words and audio text;
 *   - gender_sort exposes its item surfaces (bare nouns).
 * info bodies contribute only their «guillemet» spans.
 */
export function frSurfaces(step: LessonStep): string[] {
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
    case "word_map":
      // §13's phrase-debut mechanism (map → hear → speak): the tokens ARE
      // the taught surfaces. Without this case the tracker first "saw" a
      // mapped word at the closing match and called it a non-intro debut
      // («beaucoup», 2026-08-21).
      for (const t of (s.tokens as string[]) ?? []) out.push(t);
      out.push(String(s.audioText ?? ""));
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
      if (correct && looksFrench(correct)) out.push(correct);
      break;
    }
    case "dialogue_listen":
      for (const l of (s.lines as Array<{ kana: string }>) ?? []) out.push(l.kana);
      break;
    case "silent_letter":
      out.push(((s.graphemes as string[]) ?? []).join(""));
      out.push(String(s.audioText ?? ""));
      if (s.contrast && typeof s.contrast === "object") {
        out.push(String((s.contrast as { writtenForm?: string }).writtenForm ?? ""));
      }
      break;
    case "liaison_listen":
      out.push(String(s.audioText ?? ""));
      for (const w of (s.words as string[]) ?? []) out.push(w);
      break;
    case "gender_sort":
      for (const i of (s.items as Array<{ surface: string }>) ?? []) out.push(i.surface);
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

/** Intro-capable step types (ES pin E11 via F13). silent_letter is NOT
 *  intro-capable: it drills the spelling of an already-met word — a word
 *  whose first exposure is an orthography puzzle was never taught. */
export const FR_INTRO_TYPES: ReadonlySet<string> = new Set([
  "info",
  "phrase_card",
  "word_image_mcq",
  "word_map", // §13 phrase debut: map → hear → speak (2026-08-21)
  "build_sentence",
  "speaking",
  "listening_comprehension",
]);

// ─── Pure lints (exported for negative-control tests) ────────────────────

export type FrBarFailure = { lessonId: string; stepId: string; problem: string };

/** Primary sentence surface used >3x in one lesson (ES inv 24). */
export function lintSentenceOveruse(lesson: LessonContent): FrBarFailure[] {
  const counts = new Map<string, number>();
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    // A cloze's audioText is CONFIRMATION audio for the solved sentence —
    // the step exercises its blank, not the sentence surface (see the es
    // twin, 2026-08-21).
    if (st.type === "particle_cloze" || st.type === "agreement_cloze") continue;
    const surf =
      (st.targetSentence as string) ??
      (st.targetPhrase as string) ??
      (st.transcript as string) ??
      ((st.acceptedAnswers as string[]) ?? [])[0] ??
      (st.audioText as string);
    if (typeof surf !== "string" || !surf) continue;
    const norm = surf.toLowerCase().replace(/[?!.,\s«»]/g, "");
    if (norm.length < 8) continue; // single words repeat legitimately
    counts.set(norm, (counts.get(norm) ?? 0) + 1);
  }
  const out: FrBarFailure[] = [];
  for (const [sentence, n] of counts) {
    if (n > 3) {
      out.push({
        lessonId: lesson.id,
        stepId: "-",
        problem: `primary surface "${sentence}" used ${n}x (max 3)`,
      });
    }
  }
  return out;
}

/** Full-sentence recognition MCQ in a TEACHING lesson (ES inv 28).
 *  Registered atom surfaces are exempt: French fixed phrases («s'il vous
 *  plaît») are single vocabulary items, not built sentences. */
export function lintFullSentenceMcqs(lesson: LessonContent): FrBarFailure[] {
  const atomSurfaces = new Set(
    getFrCourseAtoms().map((a) => a.surface.toLowerCase()),
  );
  const out: FrBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (st.type !== "multiple_choice") continue;
    const options = (st.options as Array<{ id: string; text: string }>) ?? [];
    const correct = options.find((o) => o.id === st.correctOptionId)?.text ?? "";
    const bare = correct.trim().toLowerCase().replace(/\s*[?!.,]+\s*$/, "");
    if (atomSurfaces.has(bare)) continue;
    const toks = frTokens(correct);
    const sentenceShaped = /[.!?]\s*$/.test(correct.trim());
    if (looksFrench(correct) && toks.length >= 3 && (sentenceShaped || toks.length >= 4)) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem: `full-sentence recognition MCQ ("${correct}") — pick-the-built-sentence is test-out only; use build/translate/speaking`,
      });
    }
  }
  return out;
}

/** Production-framed prompt whose answer is a full phrase, on an MCQ:
 *  "reply…", "say…", "how do you say…" must be a generation step. */
export function lintProductionFramedMcqs(lesson: LessonContent): FrBarFailure[] {
  const out: FrBarFailure[] = [];
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
        problem: `production-framed prompt with a multi-word answer must be a build/translate/speaking step ("${prompt.trim().slice(0, 60)}…")`,
      });
    }
  }
  return out;
}

/** Theatrical production prompts (ES inv 29): plain only — no scenario
 *  with an internal sentence period on build/listening steps. */
export function lintTheatricalPrompts(lesson: LessonContent): FrBarFailure[] {
  const out: FrBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    const isProd = st.type === "build_sentence" || st.type === "listening_build";
    const isLc = st.type === "listening_comprehension";
    if (!isProd && !isLc) continue;
    const prompt = String(st.prompt ?? st.question ?? "");
    if (/[.!?]\s+\S/.test(prompt.trim().replace(/[.!?]+$/, ""))) {
      out.push({
        lessonId: lesson.id,
        stepId: String(st.id),
        problem: `theatrical prompt ("${prompt}") — plain only; no scenario, no internal sentence period`,
      });
    }
  }
  return out;
}

/** Spot-the-mistake steps are retired course-wide (ES inv 32). */
export function lintSpotTheMistake(lesson: LessonContent): FrBarFailure[] {
  const out: FrBarFailure[] = [];
  for (const st of lesson.steps as never as Array<Record<string, unknown>>) {
    if (String(st.id ?? "").endsWith("-spot")) {
      out.push({ lessonId: lesson.id, stepId: String(st.id), problem: "spot-the-mistake step is retired" });
    }
    if (/one of these is wrong/i.test(String(st.prompt ?? ""))) {
      out.push({ lessonId: lesson.id, stepId: String(st.id), problem: '"one of these is wrong" prompt is retired' });
    }
  }
  return out;
}

// ─── Registration ────────────────────────────────────────────────────────

export function registerFrModuleBarGuards(opts: {
  moduleLabel: string;
  lessons: LessonContent[];
  /** Modules whose atoms count as already-known — pathway order up to
   *  (excluding) this module. */
  priorModules: string[];
}): void {
  const { moduleLabel, lessons, priorModules } = opts;
  const priorSet = new Set(priorModules);
  const moduleId = moduleLabel.match(/m\d+/)?.[0] ?? moduleLabel;

  const VOCAB = getFrRealFormLexicon();

  const PRIOR = new Set<string>();
  const atomModuleBySurfaceWord = new Map<string, string>();
  for (const a of getFrCourseAtoms()) {
    for (const w of frTokens(a.surface)) {
      if (!atomModuleBySurfaceWord.has(w)) {
        atomModuleBySurfaceWord.set(w, a.fromModule ?? "");
      }
      if (a.fromModule && priorSet.has(a.fromModule)) PRIOR.add(w);
    }
  }
  // (fr m5, 2026-09-01): an atom that IS a whole surface («au», «à la»)
  // is authoritative for its own intro module — token-derived attribution
  // collides: the «au» inside m1's «au revoir» is not the m5 contraction,
  // and «à la» (a multi-word surface) had no key at all. Exact surfaces
  // override token guesses; token entries remain as fallback for words
  // that are not themselves atoms.
  for (const a of getFrCourseAtoms()) {
    if (a.fromModule) {
      atomModuleBySurfaceWord.set(a.surface.toLowerCase(), a.fromModule);
    }
  }

  const fmt = (failures: FrBarFailure[]) =>
    failures.map((f) => `${f.lessonId}/${f.stepId}: ${f.problem}`);

  describe(`FR ${moduleLabel} authoring bar`, () => {
    it("no primary sentence surface repeats more than 3x per lesson", () => {
      expect(fmt(lessons.flatMap(lintSentenceOveruse))).toEqual([]);
    });

    it("no full-sentence recognition MCQs in teaching lessons", () => {
      // The mastery test-out is the FINAL lesson — derived, not hardcoded
      // (was /-8$/ in the 8-lesson IR wave; §13 modules run 9–10).
      const masteryId = lessons[lessons.length - 1]?.id;
      const teaching = lessons.filter((l) => l.id !== masteryId);
      expect(fmt(teaching.flatMap(lintFullSentenceMcqs))).toEqual([]);
    });

    it("production-framed prompts are generation steps, not MCQs", () => {
      expect(fmt(lessons.flatMap(lintProductionFramedMcqs))).toEqual([]);
    });

    it("production prompts are plain, no theatrics", () => {
      expect(fmt(lessons.flatMap(lintTheatricalPrompts))).toEqual([]);
    });

    it("no derived spot-the-mistake step (retired course-wide)", () => {
      expect(fmt(lessons.flatMap(lintSpotTheMistake))).toEqual([]);
    });

    it("GATE 5 — MCQ distractor quality", () => {
      const failures: DistractorLintFailure[] = lessons.flatMap((l) =>
        lintMcqDistractorsCore(l, {
          wordToken: /[a-zàâæçéèêëîïôœùûüÿ]{3,}/i,
          echoMinLength: 3,
          realFormLexicon: getFrRealFormLexicon(),
          isMeaningCuedFormPicker: (prompt) =>
            /\bform\b/i.test(prompt) && !FRENCH_MARK.test(prompt),
          // No echo exemption yet: the ES exemption covers conjugation
          // pickers, and FR has no conjugation drills until its first verb
          // module. Add the FR equivalent WITH that module, not before.
        }),
      );
      expect(
        failures.map((f) => `${f.lessonId}/${f.stepId}: ${f.problem}`),
      ).toEqual([]);
    });

    it("translate stays ≤15% of production steps (ES inv 43)", () => {
      const prod = lessons.flatMap((l) =>
        l.steps.filter((s) =>
          ["build_sentence", "translate", "listening_build", "speaking"].includes(s.type),
        ),
      );
      const translate = prod.filter((s) => s.type === "translate").length;
      const share = prod.length ? translate / prod.length : 0;
      expect(
        share,
        `${moduleLabel}: translate is ${translate}/${prod.length} = ${share.toFixed(3)} of production ` +
          "(cap 0.15 — typed translation is the most fatiguing step; production belongs to build/speaking)",
      ).toBeLessThanOrEqual(0.15 + 1e-9);
    });

    it("word_image_mcq is first-exposure only (ES inv 44)", () => {
      // Judged at LESSON granularity: phrase-card intro → image retrieval a
      // few steps later in the SAME lesson is the canonical sequence; what
      // is banned is the image MCQ as a REVIEW device.
      const failures: FrBarFailure[] = [];
      const seen = new Set<string>(PRIOR);
      for (const lesson of lessons) {
        const knownAtLessonStart = new Set(seen);
        for (const step of lesson.steps) {
          if (step.type === "word_image_mcq") {
            const s = step as never as Record<string, unknown>;
            const options = (s.options as Array<{ id: string; word: string }>) ?? [];
            const correct = options.find((o) => o.id === s.correctOptionId)?.word ?? "";
            // AUDIO-PROMPTED mode is §13's zero-reading retrieval beat,
            // allowed on known words anywhere; only ENGLISH-prompted reuse
            // is banned (see the es twin, 2026-08-21).
            const audioPrompted = options.some((o) => o.word === (s.meaningEn as string));
            // §13.4 (ported from the es twin with fr m3, 2026-09-01): debut
            // surfaces WEAR their article («le chat», never bare «chat»),
            // and the article itself is known from the first article lesson
            // on. Judge first-exposure by the HEAD tokens — a leading
            // article never makes a debut "already known".
            const ARTICLE_TOKENS = new Set(["le", "la", "les", "un", "une", "des"]);
            const toks = frTokens(correct).filter(
              (t, i) => !(i === 0 && ARTICLE_TOKENS.has(t)),
            );
            if (!audioPrompted && toks.some((t) => knownAtLessonStart.has(t))) {
              failures.push({
                lessonId: lesson.id,
                stepId: step.id,
                problem: `word_image_mcq on already-known "${correct}" — the type is first-exposure only; review retrieval belongs to match/build/cloze`,
              });
            }
          }
          for (const surf of frSurfaces(step)) {
            for (const t of frTokens(surf)) seen.add(t);
          }
        }
      }
      expect(fmt(failures)).toEqual([]);
    });

    it("particle_cloze items belong to this module (ES pin E2 — intro-only)", () => {
      const failures: FrBarFailure[] = [];
      for (const lesson of lessons) {
        for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
          if (step.type !== "particle_cloze") continue;
          const correct = String(step.correctParticle ?? "");
          const fm = atomModuleBySurfaceWord.get(correct.toLowerCase());
          // §13.9 law 5 exemption: an alternating-answer discrimination
          // trial (two options, both taught, shared stem) is a pick BY
          // DESIGN and rides spaced across modules (see the es twin).
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
              problem: `particle_cloze on "${correct}" (taught ${fm}) — past its intro module the item is PRODUCED, not picked`,
            });
          }
        }
      }
      expect(fmt(failures)).toEqual([]);
    });

    it("vocab provenance: no untracked words; module-new words debut on intro-capable steps", () => {
      const unknown: string[] = [];
      const firstSeen = new Map<string, { type: string; stepId: string; lessonId: string }>();
      for (const lesson of lessons) {
        for (const step of lesson.steps) {
          for (const surf of frSurfaces(step)) {
            for (const t of frTokens(surf)) {
              if (FR_FUNCTION_WORDS.has(t) || FR_PROPER_NAMES.has(t)) continue;
              if (!VOCAB.has(t)) {
                unknown.push(`untracked word "${t}" in ${lesson.id}/${step.id} ("${surf.slice(0, 50)}")`);
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
        if (!FR_INTRO_TYPES.has(first.type)) {
          nonIntro.push(
            `"${word}" debuts on non-intro step type ${first.type} (${first.lessonId}/${first.stepId})` +
              (first.type === "dialogue_listen"
                ? " — TEACH-FIRST: a dialogue can't be a word's first exposure"
                : ""),
          );
        }
      }
      expect(unknown, `untracked words:\n  ${unknown.slice(0, 15).join("\n  ")}`).toEqual([]);
      expect(nonIntro, `non-intro debuts:\n  ${nonIntro.slice(0, 15).join("\n  ")}`).toEqual([]);
    });
  });
}
