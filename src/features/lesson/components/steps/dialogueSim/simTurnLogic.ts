/**
 * Pure turn logic for the `dialogue_sim` prototype (2026-07-29). Kept out of
 * the view so grading + reveal rules are unit-testable without standing up
 * Settings/Language context, and so the view stays under the ~400 LOC smell
 * line.
 *
 * MAX-ACCEPTANCE is the point of this file (Spencer 2026-07-24: "we need as
 * many grammatically correct or close translations of the sentence as
 * possible to be correct"; 2026-07-29: "good to not dumb it down too much").
 * A shop counter has more than one right move, and marking a real one wrong
 * is the worst thing a simulation can do — it teaches the learner to guess
 * the author instead of speaking.
 */
import type { DialogueSimReply, DialogueSimTurn } from "../../../types";
import { expandAcceptedAnswers } from "../translateVariants";
import { normalizeTypedAnswer } from "@/shared/speech";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

/**
 * Every accepted surface for a build-mode reply, normalized for comparison.
 * Runs each authored rendering through the SAME expander the build/translate
 * views use (register widening + particle scrambles + punctuation), so a
 * learner who says これを おねがいします instead of これを ください, or who
 * reaches the polite form of a plain answer, is not punished for it.
 */
export function acceptedBuildSurfaces(
  reply: Extract<DialogueSimReply, { mode: "build" }>,
  moduleIndex: number | null = null,
): ReadonlySet<string> {
  const seeds = [reply.answer, ...(reply.alsoAccepted ?? [])].filter(Boolean);
  return new Set(
    expandAcceptedAnswers(seeds, { moduleIndex }).map((v) =>
      normalizeTypedAnswer(v),
    ),
  );
}

/**
 * Grade a placed-tile reply. Tiles are joined with a space (word-granularity
 * builds are spaced in this course) but `normalizeTypedAnswer` strips
 * whitespace on both sides anyway, so spacing can never be the difference
 * between right and wrong.
 */
export function isBuildReplyAccepted(
  placed: readonly string[],
  reply: Extract<DialogueSimReply, { mode: "build" }>,
  moduleIndex: number | null = null,
): boolean {
  if (placed.length === 0) return false;
  return acceptedBuildSurfaces(reply, moduleIndex).has(
    normalizeTypedAnswer(placed.join(" ")),
  );
}

/** Every option id that counts as a correct reply (branching-lite). */
export function acceptedChoiceIds(
  reply: Extract<DialogueSimReply, { mode: "choice" }>,
): ReadonlySet<string> {
  return new Set([reply.correctOptionId, ...(reply.alsoCorrectOptionIds ?? [])]);
}

export function isChoiceReplyAccepted(
  optionId: string | undefined,
  reply: Extract<DialogueSimReply, { mode: "choice" }>,
): boolean {
  return optionId !== undefined && acceptedChoiceIds(reply).has(optionId);
}

/**
 * Should the NPC line's kana + gloss be readable yet?
 *
 * `listenFirst` scenarios mask the line so the learner has to LISTEN before
 * replying — that is the whole Pimsleur mechanic. Four escapes, in order of
 * how much they matter:
 *
 *  1. `hasAudio: false` — no clip exists, so masking would be an unwinnable
 *     silent wall. Un-generated lines reveal immediately. (The prototype's
 *     ふくろは いりますか has no clip today; this is not hypothetical.)
 *  2. `played` — the clip finished at least once. The mask has done its job.
 *  3. `manuallyShown` — the learner tapped "Show text". Never trap anyone.
 *  4. `committed` — the turn is answered; hiding it now teaches nothing.
 */
export function npcLineRevealed(args: {
  listenFirst: boolean;
  hasAudio: boolean;
  played: boolean;
  manuallyShown: boolean;
  committed: boolean;
}): boolean {
  if (!args.listenFirst) return true;
  return (
    !args.hasAudio || args.played || args.manuallyShown || args.committed
  );
}

/**
 * Scenario-level verdict reported to LessonPage via `onComplete`. One step =
 * one scenario, so the step is "correct" only when every turn was answered
 * acceptably — same all-or-nothing rule `dialogue_listen` applies across its
 * comprehension questions.
 */
export function scenarioCorrect(
  turns: readonly DialogueSimTurn[],
  verdicts: Readonly<Record<string, boolean>>,
): boolean {
  return turns.length > 0 && turns.every((t) => verdicts[t.id] === true);
}

/** Canonical model reply text for a turn (shown/played after commit). */
export function modelReplyText(turn: DialogueSimTurn): string {
  const { reply } = turn;
  if (reply.mode === "build") return reply.answer;
  return (
    reply.options.find((o) => o.id === reply.correctOptionId)?.text ?? ""
  );
}

/** TTS lookup key for the model reply — authored override wins. */
export function modelReplyAudioText(turn: DialogueSimTurn): string {
  return turn.reply.audioText ?? modelReplyText(turn);
}

/**
 * Ruby data for the canonical model reply — parallel to `modelReplyText`
 * (TestFlight #154: dialogue_sim had no `*Annotation` field, so kanji could
 * never surface here). `undefined` for older/non-JA content with no
 * annotation authored, which the view falls back to plain text for.
 */
export function modelReplyAnnotation(
  turn: DialogueSimTurn,
): JapaneseAnnotation[] | undefined {
  const { reply } = turn;
  if (reply.mode === "build") return reply.answerAnnotation;
  const idx = reply.options.findIndex((o) => o.id === reply.correctOptionId);
  return idx >= 0 ? reply.optionAnnotations?.[idx] : undefined;
}

/** Ruby data for one choice option, by option id — `undefined` if the
 *  reply carries no `optionAnnotations` or the id doesn't resolve. */
export function choiceOptionAnnotation(
  reply: Extract<DialogueSimReply, { mode: "choice" }>,
  optionId: string | undefined,
): JapaneseAnnotation[] | undefined {
  if (optionId === undefined) return undefined;
  const idx = reply.options.findIndex((o) => o.id === optionId);
  return idx >= 0 ? reply.optionAnnotations?.[idx] : undefined;
}

/**
 * Concatenate PLACED build-tile annotations (in placement order) into one
 * ruby sequence, with a plain space segment between tiles — mirrors how the
 * learner's transcript bubble TEXT is built (`tiles.join(" ")`). Returns
 * undefined when there's nothing placed or the reply carries no
 * `tileAnnotations` (older/non-JA content), so the caller falls back to
 * plain text uniformly rather than rendering a partial ruby sequence.
 */
export function joinTileAnnotations(
  tileAnnotations: readonly (JapaneseAnnotation[] | undefined)[] | undefined,
  placedIndices: readonly number[],
): JapaneseAnnotation[] | undefined {
  if (!tileAnnotations || placedIndices.length === 0) return undefined;
  const segments: JapaneseAnnotation[] = [];
  for (const [pos, i] of placedIndices.entries()) {
    const seg = tileAnnotations[i];
    if (!seg) return undefined; // partial data — fall back to plain text
    if (pos > 0) segments.push({ surface: " ", reading: " " });
    segments.push(...seg);
  }
  return segments;
}
