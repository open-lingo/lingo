/**
 * Shared factories for the JA M3-M7 grammar-spine modules (2026-05-16).
 *
 * Tightens repetition across the 5 newly authored modules + review pools.
 * No new step types — only thin wrappers over the existing primitives so
 * call sites stay readable.
 */
import type {
  BuildSentenceStep,
  GrammarRuleStep,
  GrammarExample,
  InfoStep,
  ParticleClozeStep,
  PhraseCardStep,
  SpeakingStep,
} from "../types";

export function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export function phrase(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
): ParticleClozeStep {
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options,
    meaningEn,
    audioText,
    explanation,
  };
}

export function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
): BuildSentenceStep {
  return {
    id,
    type: "build_sentence",
    prompt,
    targetSentence: target,
    tiles,
    correctOrder,
    granularity: "word",
    audioKey: target,
    targetAnnotation: [{ surface: target, reading: target }],
  };
}

export function infoStep(
  id: string,
  title: string,
  body: string,
  variant: InfoStep["variant"] = "default",
): InfoStep {
  return { id, type: "info", title, body, variant };
}

export function grammarRule(opts: {
  id: string;
  title: string;
  rule: string;
  examples: GrammarExample[];
  antiPattern?: GrammarExample & { why: string };
  cultureNote?: string;
}): GrammarRuleStep {
  return {
    id: opts.id,
    type: "grammar_rule",
    title: opts.title,
    rule: opts.rule,
    examples: opts.examples,
    antiPattern: opts.antiPattern,
    cultureNote: opts.cultureNote,
  };
}

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
): SpeakingStep {
  return {
    id,
    type: "speaking",
    targetPhrase,
    translation,
    stubbed: true,
    audioKey: targetPhrase,
    targetAnnotation: [{ surface: targetPhrase, reading: targetPhrase }],
  };
}

/**
 * Speaking-target option for the dialogue lesson factory.
 *
 * "representative": one whole-utterance speaking step appended to the
 * dialogue (default for now per Spencer's spec — wait for Whisper
 * sentence-level validation before per-line).
 *
 * "per-line": one speaking step per dialogue line where `speakingPhrase`
 * is non-null. Architectural switch only — turn on later by changing this
 * one arg at the call site.
 */
export type SpeakingTargets = "representative" | "per-line";

export type DialogueLine = {
  speaker: string;
  meaningEn: string;
  romaji: string;
  kana: string;
  cultureNote?: string;
  /** If non-null, available as a speaking target when mode is per-line. */
  speakingPhrase?: string;
};

/**
 * Dialogue lesson factory — composes a phrase-card-per-line dialogue plus
 * a speaking step. Hook for future per-line speaking via `speakingTargets`
 * option.
 */
export function dialogueLesson(opts: {
  idPrefix: string;
  /** Whole-utterance speaking phrase + translation for the representative
   *  mode. Required so that, even in per-line mode, a sane fallback exists
   *  when none of the lines declare `speakingPhrase`. */
  representative: { phrase: string; translation: string };
  lines: DialogueLine[];
  speakingTargets?: SpeakingTargets;
}): (PhraseCardStep | SpeakingStep)[] {
  const mode: SpeakingTargets = opts.speakingTargets ?? "representative";
  const out: (PhraseCardStep | SpeakingStep)[] = [];
  for (let i = 0; i < opts.lines.length; i++) {
    const line = opts.lines[i];
    out.push({
      id: `${opts.idPrefix}-l${i + 1}`,
      type: "phrase_card",
      meaningEn: `${line.speaker}: ${line.meaningEn}`,
      romaji: line.romaji,
      kana: line.kana,
      cultureNote: line.cultureNote,
    });
    if (mode === "per-line" && line.speakingPhrase) {
      out.push(
        speaking(
          `${opts.idPrefix}-l${i + 1}-say`,
          line.speakingPhrase,
          line.meaningEn,
        ),
      );
    }
  }
  if (mode === "representative") {
    out.push(
      speaking(
        `${opts.idPrefix}-say`,
        opts.representative.phrase,
        opts.representative.translation,
      ),
    );
  }
  return out;
}
