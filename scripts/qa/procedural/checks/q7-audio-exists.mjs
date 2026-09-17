/**
 * Q7 audio-exists: every spoken surface has a TTS clip. Reuses the
 * manifest-coverage resolution rule (`lib/ttsCoverage.mjs`, ported from
 * `src/shared/tts/manifest.ts`'s `resolveTtsPath`).
 */
import { hasTtsClip } from "../lib/ttsCoverage.mjs";

export const id = "Q7";
export const question = "does every spoken surface in this step have a recorded TTS clip?";
export const enforced = true;

/** Mirrors `DialogueListenStepView.tsx`'s `splitJaSentences` /
 *  `playLineAudio`: a multi-sentence dialogue line plays sentence-by-
 *  sentence when EVERY sentence has its own clip, falling back to the
 *  whole-line clip otherwise. Checking only the whole-line string (as
 *  earlier versions of this check did) false-flagged long-shipped m3
 *  content whose sentences are individually voiced but were never
 *  recorded as one concatenated clip. */
function splitJaSentences(text) {
  return (text.match(/[^。？！]+[。？！]?」?/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

function hasCoverage(lang, text) {
  if (hasTtsClip(lang, text)) return true;
  const sentences = splitJaSentences(text);
  return sentences.length > 1 && sentences.every((s) => hasTtsClip(lang, s));
}

/** Fields that are spoken (played as audio), per step type — the audio-key
 *  convention across the JA step views (`audioKey` for build/listen/speak,
 *  `audioText` for cloze/kanji-reading explanation audio, dialogue lines
 *  play their own `kana`). */
function spokenTexts(step) {
  const out = [];
  if (typeof step.audioKey === "string") out.push(step.audioKey);
  if (typeof step.audioText === "string") out.push(step.audioText);
  if (typeof step.targetPhrase === "string" && step.type === "speaking") out.push(step.targetPhrase);
  if (Array.isArray(step.lines)) for (const l of step.lines) if (l.kana) out.push(l.kana);
  if (step.turns && Array.isArray(step.turns)) {
    for (const t of step.turns) {
      if (t.npc?.kana) out.push(t.npc.kana);
    }
  }
  return [...new Set(out)];
}

export function appliesTo(step) {
  return spokenTexts(step).length > 0;
}

export async function run(step, ctx) {
  const texts = spokenTexts(step);
  const missing = texts.filter((t) => !hasCoverage(ctx.lang, t));
  if (missing.length === 0) return { answer: "yes", evidence: [`${texts.length} spoken surface(s), all have clips`] };
  return { answer: "no", evidence: missing.map((t) => `no TTS clip for "${t}"`) };
}

/** Plant: point the audio key at text that has certainly never been
 *  recorded. */
export function plant(step) {
  const clone = structuredClone(step);
  if (typeof clone.audioKey === "string") clone.audioKey = "コレハゼッタイニロクオンサレテイナイブンショウデス";
  else if (typeof clone.audioText === "string")
    clone.audioText = "コレハゼッタイニロクオンサレテイナイブンショウデス";
  return clone;
}
