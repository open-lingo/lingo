/**
 * DEV · Data shape for the transfer diagram (give/receive and friends).
 *
 * This file is deliberately a MIRROR of the `diagram:` field proposed for the
 * IR rule card, so the QA page doubles as the executable spec for that shape.
 * Nothing here is imported by the curriculum, the atom registry or the TTS
 * emitter — it lives under `dev/` for the same reason `dialogueSim/` does.
 *
 * The one design commitment encoded here: a transfer sentence has FOUR facts,
 * and every one of them is a position or a label in a picture rather than a
 * clause of prose.
 *
 *   1. which side of the うち boundary each party stands on
 *   2. which way the thing travelled          -> arrow direction
 *   3. who the sentence is ABOUT               -> `subject`
 *   4. which party the verb has already named  -> `hidden`
 *
 * Fact 4 is the one m31's prose spends ~80 characters asserting ("with くれる
 * the receiver — me — drops out of the sentence entirely, because the verb has
 * already said it"). A dashed ghost shows it instead.
 */

import type { TransferDiagramSpec } from "../../types";

/** A dev fixture: the shared spec plus an id for React keys and keyframe scoping. */
export type DevTransferSpec = TransferDiagramSpec & {
  readonly id: string;
  readonly title: string;
};

/**
 * m31 L1 — the axis. Note the layout invariant: わたし NEVER changes sides.
 * The うち boundary is fixed and the ARROW is what moves. If the learner's
 * anchor jumped left and right per row the picture would teach nothing.
 */
export const M31_AXIS: DevTransferSpec = {
  id: "m31-axis",
  title: "あげる · くれる · もらう",
  insideLabel: "うち",
  outsideLabel: "そと",
  left: { label: "わたし", gloss: "me", inside: true, color: "#fb923c" },
  right: { label: "ともだち", gloss: "my friend", inside: false, color: "#2dd4bf" },
  object: { label: "プレゼント", particle: "を" },
  rows: [
    {
      verb: "あげる",
      from: "left",
      leftParticle: "は",
      rightParticle: "に",
      subject: "left",
      note: "The thing leaves the circle. I am what the sentence is about.",
    },
    {
      verb: "くれる",
      from: "right",
      rightParticle: "が",
      subject: "right",
      hidden: "left",
      note: "Same thing, arrow reversed. My friend is the subject — and I drop out, because くれる can only point at me.",
    },
    {
      verb: "もらう",
      from: "right",
      leftParticle: "は",
      rightParticle: "に",
      subject: "left",
      note: "SAME arrow as くれる. Only the subject moved: now I am the one the sentence is about.",
    },
  ],
};

/**
 * m31 L7 — かす / かりる. Proves the diagram is not a give/receive special
 * case: same renderer, same four facts, a different pair of verbs.
 */
export const M31_LOAN: DevTransferSpec = {
  id: "m31-loan",
  title: "かす · かりる",
  insideLabel: "うち",
  outsideLabel: "そと",
  left: { label: "わたし", gloss: "me", inside: true, color: "#fb923c" },
  right: { label: "ともだち", gloss: "my friend", inside: false, color: "#2dd4bf" },
  object: { label: "かさ", particle: "を" },
  rows: [
    {
      verb: "かす",
      from: "left",
      leftParticle: "は",
      rightParticle: "に",
      subject: "left",
      note: "I lend. The umbrella leaves my side — and comes back later.",
    },
    {
      verb: "かりる",
      from: "right",
      leftParticle: "は",
      rightParticle: "に",
      subject: "left",
      note: "I borrow. Arrow reversed, but に stays on my friend — this is the に that does NEW work, not the recipient に from L1.",
    },
  ],
};

/**
 * The blocklist case. あに/あね/ちち/はは are in WORD_IMAGE_MCQ_BLOCKLIST
 * because, per the 2026-05-18 audit, an "older brother" PORTRAIT reads as a
 * generic person — "age cue carried by kanji, not face."
 *
 * A diagram does not draw a face. あに is a labelled node standing inside the
 * うち boundary, and "older / mine" is carried by the label and the circle.
 * That is a different surface from word_image_mcq, NOT a refutation of the
 * audit — the portrait problem is real and this simply is not a portrait.
 */
export const M31_FAMILY: DevTransferSpec = {
  id: "m31-family",
  title: "あに inside the circle",
  insideLabel: "うち",
  outsideLabel: "そと",
  left: { label: "あに", gloss: "my older brother", inside: true, color: "#c084fc" },
  right: { label: "せんせい", gloss: "the teacher", inside: false, color: "#60a5fa" },
  object: { label: "じしょ", particle: "を" },
  rows: [
    {
      verb: "くれる",
      from: "left",
      leftParticle: "が",
      subject: "left",
      hidden: "right",
      note: "あに is inside MY circle, so a thing he hands me still arrives — くれる. No face required to say that.",
    },
    {
      verb: "あげる",
      from: "left",
      leftParticle: "は",
      rightParticle: "に",
      subject: "left",
      note: "Same brother, pointing out of the circle at the teacher. あげる.",
    },
  ],
};

export const ALL_SPECS: readonly DevTransferSpec[] = [
  M31_AXIS,
  M31_LOAN,
  M31_FAMILY,
];
