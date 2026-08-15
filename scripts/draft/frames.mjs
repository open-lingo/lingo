#!/usr/bin/env node
/**
 * Grammar FRAMES — the part of sentence generation that a language model
 * should never touch.
 *
 * ─── why this file is shaped like this ──────────────────────────────────
 *
 * Three attempts at cheap local generation, measured on this repo's own gate:
 *
 *   1. Free-form prompt, 603 taught words listed.        1 / 12 usable.
 *      The model wrote lovely Japanese and ignored the word list entirely.
 *   2. JSON-schema `enum` over every output token.       0 / 12 usable.
 *      Zero untaught words — and zero Japanese. 「このアメリカのおいしいケンと
 *      たべてみる」, "delicious Ken". Constraining a free-text field to a token
 *      list removes the model's ability to form a sentence.
 *   3. This file.                                        12 / 12 grammatical.
 *
 * The lesson from (2) was not that constrained decoding fails. It was that the
 * constraint was applied to the wrong thing. Here the grammar is a template in
 * JavaScript, the vocabulary is an `enum` on each SLOT, and the model's only
 * remaining job is choosing combinations that mean something — which is the
 * one part of the task it is actually good at.
 *
 * Consequences worth stating plainly:
 *   - Grammaticality is not sampled, it is guaranteed. There is no failure
 *     rate to measure because the model never emits Japanese syntax.
 *   - The vocabulary gate cannot fail either; every slot is drawn from taught
 *     words by construction.
 *   - So the ONLY thing left to check by reading is whether a combination
 *     makes sense, and even that mostly reduces to whether the inventory pools
 *     are right. See `inventory.mjs`.
 *
 * A frame that encodes a module's hard rules as NARROWED SLOT POOLS rather
 * than as post-hoc validation is strictly better: the m31 antiPattern
 * (×わたしにあげる) is unreachable below, not merely detected.
 */

/**
 * Japanese in this course is written with spaces at phrase (bunsetsu)
 * boundaries — 「この りょうりを たべてみる。」 — because the build-tile step
 * splits on them. Assemble from chunks and join, never concatenate.
 */
const j = (...chunks) => chunks.filter(Boolean).join(" ") + "。";

/** @typedef {{kana: string, gloss: string}} Word */

/**
 * m31 · n4-02 — Give & receive I: あげる・くれる・もらう.
 *
 * The module's payload is VIEWPOINT (the うち/そと axis), and viewpoint is
 * mechanical: which pool each participant is drawn from IS the rule. So each
 * verb gets its own frame with its own pools, and the spine's stated ban —
 * "あげる cannot point at me (×わたしにあげる)" — is enforced by あげる's
 * receiver pool simply not containing any inside person.
 *
 * Per the spine: no て-forms anywhere in this module (those are n4-06).
 */
export const m31 = {
  module: "m31",
  /**
   * Inside the speaker's circle — the うち side of the axis.
   *
   * The honorific family terms (おにいさん, おかあさん …) are HERE, not in the
   * outside pool, even though the registry tags them like any other person
   * word. They denote the same referents as あに/はは under a different
   * register, and leaving them outside produced 「あには おにいさんに きっぷを
   * あげます」 — "my older brother gives a ticket to his older brother", one
   * person giving to himself. うち/そと is about the referent, not the word.
   */
  inside: [
    "わたし", "ちち", "はは", "あに", "あね", "いもうと", "おとうと", "かぞく",
    "おにいさん", "おねえさん", "おかあさん", "おとうさん", "きょうだい",
  ],
  /** Categories the object slot may draw from. */
  objectPools: { giftable: true },

  variants: {
    ageru: {
      verb: "あげる",
      polite: "あげます",
      /** giver: inside. receiver: OUTSIDE ONLY — this is the antiPattern, made unreachable. */
      giverSide: "inside",
      receiverSide: "outside",
      build: (g, r, o) => j(`${g}は`, `${r}に`, `${o}を`, "あげます"),
      buildPlain: (g, r, o) => j(`${g}は`, `${r}に`, `${o}を`, "あげる"),
      enFallback: ({ glossG, glossR, glossO }) => `${glossG} gives ${glossO} to ${glossR}`,
      exercises: ["ageru", "ni-recipient", "wo-object"],
      hintJa: "あげる＝わたし（や自分の家族）から外の人へ、ものが動きます。",
    },
    kureru: {
      verb: "くれる",
      polite: "くれます",
      giverSide: "outside",
      receiverSide: "inside",
      build: (g, r, o) => j(`${g}は`, `${r}に`, `${o}を`, "くれます"),
      buildPlain: (g, r, o) => j(`${g}は`, `${r}に`, `${o}を`, "くれる"),
      enFallback: ({ glossG, glossR, glossO }) => `${glossG} gives ${glossO} to ${glossR}`,
      exercises: ["kureru", "ni-recipient", "wo-object"],
      hintJa: "くれる＝外の人から、わたし（や自分の家族）へ、ものが動きます。",
    },
    morau: {
      verb: "もらう",
      polite: "もらいます",
      giverSide: "outside",
      receiverSide: "inside",
      /** The subject FLIPS to the receiver — the module's second hard fact. */
      build: (g, r, o) => j(`${r}は`, `${g}に`, `${o}を`, "もらいます"),
      buildPlain: (g, r, o) => j(`${r}は`, `${g}に`, `${o}を`, "もらう"),
      enFallback: ({ glossG, glossR, glossO }) => `${glossR} receives ${glossO} from ${glossG}`,
      exercises: ["morau", "ni-source", "wo-object"],
      hintJa: "もらう＝受け取る人が主語（は）になります。あげる人には「に」がつきます。",
    },
  },

  /**
   * Residual checks. Everything the frame already guarantees is deliberately
   * absent here — this catches only what a narrowed pool cannot express.
   */
  check({ giver, receiver }) {
    const errs = [];
    if (giver === receiver) errs.push("giver and receiver are the same person");
    return errs;
  },
};

export const FRAMES = { m31 };

/**
 * Turn a filled frame into the YAML beat the IR actually wants.
 *
 * The DIVISION OF LABOUR here is deliberate and asymmetric. `ja` is assembled
 * by the frame, because Japanese syntax is what the local model gets wrong.
 * `en` is taken from the model, because idiomatic English — articles,
 * "gives me" vs "gives to me", when to say "some" — is what a template gets
 * wrong, and it is what the model is best at. A frame-built English gloss
 * reads like "I gives friend book".
 *
 * `mode` cycles build → build → listening → build → translate so a lesson gets
 * the mix m30 uses rather than twelve identical build steps.
 */
const MODES = ["build", "build", "listening", "build", "translate"];
export function toBeat(variant, filled, i) {
  const { giver, receiver, object, en } = filled;
  return {
    kind: "sentence",
    ja: variant.build(giver, receiver, object),
    en: en ?? variant.enFallback(filled),
    exercises: variant.exercises,
    mode: MODES[i % MODES.length],
  };
}

/** Render a beat as the single-line flow-mapping YAML the IR files use. */
export function beatYaml(b) {
  const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
  return (
    `      - { kind: ${b.kind}, ja: ${q(b.ja)}, en: ${q(b.en)}, ` +
    `exercises: [${b.exercises.join(", ")}], mode: ${b.mode} }`
  );
}
