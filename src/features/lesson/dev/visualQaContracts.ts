/**
 * GATE 10 — visual-QA expected-state contracts.
 *
 * For every step of a lesson, derive a machine-generated "this is what the
 * rendered step must show / must never show" contract from the step data +
 * the script-ladder constants. A vision model (or a human) judges each
 * step screenshot AGAINST its contract — specific expectations, not a
 * generic "does this look right".
 *
 * Contracts are derived from the SAME content pipeline the app renders
 * (`getMockLessonContent`, kanji post-pass included), so expected text is
 * the post-substitution surface, exactly what should be on screen.
 *
 * Pipeline (see docs/visual-qa-gate-2026-07-17.md):
 *   1. `npm run visual-qa:contracts` — emits contracts.json per lesson
 *   2. `npm run visual-qa:capture`   — Playwright screenshots each step
 *   3. judge pass — screenshots + contracts → verdicts (see
 *      scripts/visual-qa/judge-prompt.md)
 */
import { getMockLessonContent } from "../data/mockLessons";
import { formatPrompt } from "../components/formatPrompt";
import type { LessonStep } from "../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import {
  HIRAGANA_ROMAJI_OFF_MODULE,
  KATAKANA_ROMAJI_OFF_MODULE,
} from "@/shared/settings/romanizationAutoFlip";
import { KANJI_RECOGNITION_MODULE } from "@/features/languages/ja/secondScript/kanjiRollout";

/**
 * ORACLE INDEPENDENCE (validation finding, 2026-07-17): do NOT reuse the
 * app's `parseModuleIndex` here. When its regex regressed (required the
 * `ja-` prefix), contracts generated through it inherited moduleIndex=0 and
 * declared "romaji expected" for an m8 lesson — the oracle self-corrupted
 * into agreeing with the bug it existed to catch. The contract generator
 * derives module position with its own trivial parse so a shared-code bug
 * can never align the contract with the defect.
 */
function independentModuleIndex(moduleId: string): number {
  const m = /(?:^|-)m(\d+)(?:-|$)/.exec(moduleId);
  if (!m) throw new Error(`visualQaContracts: cannot parse module from '${moduleId}'`);
  return Number(m[1]);
}

export type StepContract = {
  lessonId: string;
  moduleIndex: number;
  stepIndex: number;
  stepId: string;
  stepType: LessonStep["type"];
  /** Text that must be visible somewhere on the step. */
  mustShow: string[];
  /** Text/conditions that must NOT be visible. */
  mustNotShow: string[];
  /** Prose expectations for the judge (step-specific). */
  expectations: string[];
};

export type LessonContractSet = {
  lessonId: string;
  moduleIndex: number;
  /** Prose invariants that apply to EVERY step of this lesson. */
  universalExpectations: string[];
  steps: StepContract[];
};

/** The on-screen surface of an annotated run: post-kanji-substitution. */
function surfaceOf(
  ann: JapaneseAnnotation[] | undefined,
  fallback: string,
): string {
  if (!ann || ann.length === 0) return fallback;
  return ann.map((a) => a.surface).join("");
}

function universalExpectations(moduleIndex: number): string[] {
  const exp: string[] = [
    "Kana helper text floating above BASE TEXT THAT IS THE IDENTICAL KANA is always a defect (e.g. あの floating above あの).",
    "Latin romaji directly above/attached to KANJI is always a defect (never-mix rule). Small kana furigana above kanji is correct.",
    "No placeholder artifacts: 'undefined', 'null', '[object Object]', NaN, or unresolved i18n keys (e.g. 'lesson.something').",
    "No empty answer buttons/tiles, no two answer options with identical visible text.",
    "No clipped, overlapping, or truncated Japanese text in the step card.",
  ];
  if (moduleIndex >= KATAKANA_ROMAJI_OFF_MODULE) {
    exp.push(
      `Module ${moduleIndex} ≥ M${KATAKANA_ROMAJI_OFF_MODULE}: NO Latin romaji helpers anywhere over Japanese text (hiragana OR katakana).`,
    );
  } else if (moduleIndex >= HIRAGANA_ROMAJI_OFF_MODULE) {
    exp.push(
      `Module ${moduleIndex} ≥ M${HIRAGANA_ROMAJI_OFF_MODULE}: NO Latin romaji helpers over hiragana words. Romaji over KATAKANA-only words is still allowed (until M${KATAKANA_ROMAJI_OFF_MODULE}).`,
    );
  } else {
    exp.push(
      `Module ${moduleIndex} < M${HIRAGANA_ROMAJI_OFF_MODULE}: Latin romaji helpers over kana words are EXPECTED on teaching surfaces (their absence on every surface is suspicious, though test/quiz cards may hide them deliberately).`,
    );
  }
  if (moduleIndex >= KANJI_RECOGNITION_MODULE) {
    exp.push(
      `Module ${moduleIndex} ≥ M${KANJI_RECOGNITION_MODULE}: kanji may appear in sentence surfaces, optionally with kana furigana above. Kanji rendering as tofu/boxes is a defect.`,
    );
  }
  return exp;
}

function contractForStep(
  lessonId: string,
  moduleIndex: number,
  stepIndex: number,
  step: LessonStep,
): StepContract {
  const mustShow: string[] = [];
  const mustNotShow: string[] = [];
  const expectations: string[] = [];

  switch (step.type) {
    case "multiple_choice": {
      if (!step.audioOnlyPrompt) {
        mustShow.push(surfaceOf(step.promptAnnotation, step.prompt));
      } else {
        expectations.push(
          "Audio-only prompt: a large Play control instead of prompt text.",
        );
        mustNotShow.push(step.prompt);
      }
      step.options.forEach((o, i) =>
        mustShow.push(surfaceOf(step.optionAnnotations?.[i], o.text)),
      );
      expectations.push(
        `Exactly ${step.options.length} tappable options, all distinct.`,
      );
      break;
    }
    case "build_sentence":
    case "listening_build": {
      mustShow.push(step.prompt);
      step.tiles.forEach((t) => mustShow.push(t));
      expectations.push(
        `A tile bank with ${step.tiles.length} tiles and an empty answer tray (pre-interaction).`,
      );
      break;
    }
    case "speaking": {
      mustShow.push(surfaceOf(step.targetAnnotation, step.targetPhrase));
      mustShow.push(step.translation);
      expectations.push(
        "A mic / tap-to-speak control and a play control for the target phrase.",
      );
      break;
    }
    case "fill_blank": {
      expectations.push(
        "A sentence with a visible blank slot and a word bank below.",
      );
      if (step.wordBank) step.wordBank.forEach((w) => mustShow.push(w));
      break;
    }
    case "conjugation_transform": {
      mustShow.push(step.base);
      mustShow.push(step.formLabel);
      // Stage is learner-state-dependent; the capture profile is fresh, so
      // graded captures render STAGE 1: MCQ with the answer among 3
      // options and the rule table pinned. The ungraded tease renders a
      // typed input — its answer is never on screen pre-interaction.
      if (!step.ungraded) mustShow.push(step.answer);
      expectations.push(
        step.ungraded
          ? "Ungraded type-tease: a typed input, no streak flame."
          : "Fresh profile renders stage 1: three MCQ options (answer + 2 formation distractors), the rule table with one row per verb class (canonical examples), stage chip, and streak flame.",
      );
      break;
    }
    case "translate": {
      // Mirror the render path: TranslateStepView sentence-cases English
      // prompts via formatPrompt, so the oracle must expect the cased form
      // ("Book", not "book") or judges flag phantom mustShow mismatches.
      mustShow.push(formatPrompt(surfaceOf(step.sourceAnnotation, step.sourceText)));
      break;
    }
    case "listening_comprehension": {
      step.options.forEach((o) => mustShow.push(o.text));
      mustShow.push(step.question);
      expectations.push(
        "Play control for the audio; transcript may be hidden pre-answer.",
      );
      break;
    }
    case "match_pairs": {
      step.pairs.forEach((p) => {
        mustShow.push(surfaceOf(p.sourceAnnotation, p.source));
        mustShow.push(p.target);
      });
      expectations.push(
        `Two columns of ${step.pairs.length} tiles each; no pre-matched pairs.`,
      );
      break;
    }
    case "grammar_rule": {
      mustShow.push(step.title);
      const ex = step.examples[0];
      if (ex) mustShow.push(ex.ja);
      expectations.push(
        "A rule card: title, rule text, at least one JA example with its English gloss.",
      );
      break;
    }
    case "particle_cloze": {
      mustShow.push(step.prompt.before);
      if (step.prompt.after) mustShow.push(step.prompt.after);
      step.options.forEach((o) => mustShow.push(o));
      expectations.push(
        "Sentence with an inline blank between the before/after fragments; particle buttons below.",
      );
      break;
    }
    case "kanji_reading": {
      mustShow.push(step.kanji);
      step.options.forEach((o) => mustShow.push(o.text));
      expectations.push(
        "The tested kanji renders LARGE and BARE: no furigana above it, no romaji — the reading is the answer.",
      );
      mustNotShow.push(
        `the reading '${step.reading}' floated above/attached to the kanji ${step.kanji} (it may of course appear among the answer options)`,
      );
      break;
    }
    case "self_explanation_mcq": {
      mustShow.push(step.question);
      expectations.push("An anchor card plus explanation options.");
      break;
    }
    case "info":
    case "phrase_card": {
      const s = step as { title?: string; kana?: string; body?: string };
      if (s.title) mustShow.push(s.title);
      if (s.kana) mustShow.push(s.kana);
      break;
    }
    default: {
      expectations.push(
        `Step type '${step.type}': verify the card renders coherent, non-empty content (no generated contract for this type yet).`,
      );
    }
  }

  return {
    lessonId,
    moduleIndex,
    stepIndex,
    stepId: step.id,
    stepType: step.type,
    mustShow: mustShow.filter(Boolean),
    mustNotShow,
    expectations,
  };
}

export function buildLessonContracts(lessonId: string): LessonContractSet {
  const lesson = getMockLessonContent(lessonId);
  if (!lesson) throw new Error(`visualQaContracts: unknown lesson '${lessonId}'`);
  const moduleIndex = independentModuleIndex(lesson.moduleId);
  return {
    lessonId,
    moduleIndex,
    universalExpectations: universalExpectations(moduleIndex),
    steps: lesson.steps.map((s, i) =>
      contractForStep(lessonId, moduleIndex, i, s),
    ),
  };
}
