/**
 * Comprehension questions for the conversation listener.
 *
 * After the learner hears an authored dialogue end-to-end, we ask
 * context/comprehension questions built deterministically from the dialogue
 * itself: "What did {speaker} say?", with the correct English gloss among
 * distractor glosses drawn from the OTHER lines in the same conversation. This
 * is content-agnostic — it works for any authored dialogue without per-item
 * question authoring — and honestly tests whether the learner followed who
 * said what.
 */
import type { Conversation, ConversationLine } from "@/features/practice/content";

export interface ConversationQuestion {
  id: string;
  /** Human speaker label the line belongs to. */
  speakerLabel: string;
  /** The prompt, e.g. "What did Ken say?" */
  promptSpeaker: string;
  /** English options (correct + distractors), pre-shuffled deterministically. */
  options: string[];
  /** The correct option (an English gloss). */
  correct: string;
}

/** Speaker id → display label. */
function labelFor(conv: Conversation, speakerId: string): string {
  return conv.speakers.find((s) => s.id === speakerId)?.label ?? speakerId;
}

/**
 * Up to `max` comprehension questions. One question per selected line, spread
 * across the dialogue (skip the very first line — it's the opener the learner
 * just heard cold), each asking what that speaker said. Distractors are other
 * lines' distinct glosses. Deterministic: stable ordering + rotation.
 */
export function buildConversationQuestions(
  conv: Conversation,
  max = 3,
): ConversationQuestion[] {
  const glosses = Array.from(
    new Set(conv.lines.map((l) => l.translation).filter(Boolean)),
  );
  // Not enough distinct meanings to build a real multiple-choice — bail.
  if (glosses.length < 2) return [];

  const candidates: { line: ConversationLine; index: number }[] = conv.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => Boolean(line.translation));

  // Spread selections across the dialogue rather than clustering at the top.
  const step = Math.max(1, Math.floor(candidates.length / max));
  const selected: typeof candidates = [];
  for (let i = 0; i < candidates.length && selected.length < max; i += step) {
    selected.push(candidates[i]);
  }

  return selected.map(({ line, index }, qi) => {
    const correct = line.translation;
    const distractors: string[] = [];
    for (const g of glosses) {
      if (g === correct) continue;
      if (distractors.length >= 3) break;
      distractors.push(g);
    }
    const all = [correct, ...distractors];
    // Deterministic rotation so the answer isn't always first.
    const rot = (index + qi) % all.length;
    const options = all.slice(rot).concat(all.slice(0, rot));
    return {
      id: `${conv.id}-q${index}`,
      speakerLabel: labelFor(conv, line.speaker),
      promptSpeaker: labelFor(conv, line.speaker),
      options,
      correct,
    };
  });
}
