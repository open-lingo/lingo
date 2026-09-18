#!/usr/bin/env node
/**
 * A5d — naturalness-judge PROMPT VARIANTS.
 *
 * The question under test throughout is narrower than the shipped
 * judge.mjs (which grades EN glosses against several rule categories):
 * here the judge is asked ONE question per row — "is this <lang> SENTENCE,
 * as written, natural / grammatically correct for a native speaker?" —
 * against the calibration sets in scripts/naturalness/calibration/<lang>.json.
 *
 * Four variants (docs/judge-calibration-2026-09-17.md has the citations):
 *   - baseline:         today's shape — ask for verdict + a reason, verdict
 *                        field ordered first in the schema (mirrors judge.mjs's
 *                        existing verdict-before-reason field order).
 *   - rationale-first:   same question, but the schema forces the model to
 *                        write `reason` BEFORE `verdict` — rationale-before-
 *                        verdict prompting (cited in the review: lifts
 *                        judge/human kappa ~0.55->0.75).
 *   - binary-checklist:  decompose "natural?" into 5 yes/no sub-questions
 *                        (word choice, particle/agreement, register, word
 *                        order, meaning-preserved) and DERIVE the verdict
 *                        from them, instead of one holistic call.
 *   - fewshot:           rationale-first + 5 labelled calibration-style
 *                        examples per language (curated separately from the
 *                        40-row real sample + 8 planted rows actually
 *                        scored, to avoid contaminating the evaluation).
 */

// ---------------------------------------------------------------------------
// Few-shot examples per language — NOT drawn from calibration/<lang>.json.
// Hand-picked, held out from evaluation on purpose.
// ---------------------------------------------------------------------------
export const FEWSHOT_EXAMPLES = {
  ja: [
    { sentence: "がっこうに いきます", verdict: "natural", reason: "Correct destination particle に with 行く, plain polite form." },
    { sentence: "がっこうを いきます", verdict: "unnatural", reason: "を is wrong for a destination with 行く; must be に." },
    { sentence: "あめが ふっています", verdict: "natural", reason: "Standard て-form + いる for an ongoing state (it's raining)." },
    { sentence: "あめが ふるいます", verdict: "unnatural", reason: "ふるいます is not a real conjugation of 降る; malformed verb form." },
    { sentence: "わたしは がくせいです", verdict: "natural", reason: "Plain copula です correctly used after a noun." },
  ],
  ko: [
    { sentence: "저는 학생이에요", verdict: "natural", reason: "Correct topic particle 는 + polite copula 이에요." },
    { sentence: "저는 학생을 이에요", verdict: "unnatural", reason: "을 wrongly inserted before the copula; copula takes no object particle." },
    { sentence: "비가 와요", verdict: "natural", reason: "Standard present-tense form of 오다 for weather." },
    { sentence: "비가 오와요", verdict: "unnatural", reason: "오와요 is not a real conjugation of 오다 (irregular-looking but wrong); should be 와요." },
    { sentence: "밥을 먹었어요", verdict: "natural", reason: "Correct object particle 을 + past-tense -었어요." },
  ],
  es: [
    { sentence: "tengo dos hermanos", verdict: "natural", reason: "Correct number agreement and normal word order." },
    { sentence: "tengo dos hermano", verdict: "unnatural", reason: "Missing plural agreement: 'hermano' should be 'hermanos' after 'dos'." },
    { sentence: "ella es muy alta", verdict: "natural", reason: "Correct gender agreement of the adjective with the feminine subject." },
    { sentence: "ella es muy alto", verdict: "unnatural", reason: "Gender mismatch: 'alto' should agree as 'alta' with the feminine subject 'ella'." },
    { sentence: "¿dónde está el baño?", verdict: "natural", reason: "Standard, idiomatic question." },
  ],
  fr: [
    { sentence: "j'ai deux frères", verdict: "natural", reason: "Correct elision (j'ai) and normal word order." },
    { sentence: "je ai deux frères", verdict: "unnatural", reason: "Missing obligatory elision: 'je ai' must contract to 'j'ai' before a vowel." },
    { sentence: "elle est très grande", verdict: "natural", reason: "Correct gender agreement of the adjective." },
    { sentence: "elle est très grand", verdict: "unnatural", reason: "Gender mismatch: 'grand' should agree as 'grande' with the feminine subject 'elle'." },
    { sentence: "où sont les toilettes ?", verdict: "natural", reason: "Standard, idiomatic question." },
  ],
};

const LANG_NAMES = { ja: "Japanese", ko: "Korean", es: "Spanish", fr: "French" };

function baseInstruction(lang) {
  return `You are a native-level ${LANG_NAMES[lang]} grammar judge reviewing sentences from a language-learning course. For each row, decide whether the ${LANG_NAMES[lang]} sentence AS WRITTEN is natural: grammatically correct, idiomatic word choice, correct particle/agreement/conjugation, and something a native speaker would actually say (not calqued from English or another language). Judge the sentence in isolation — you do not have the lesson's broader context, so judge only textbook grammaticality/naturalness, not whether the content is plausible.`;
}

const CHECKLIST_QUESTIONS = [
  "word_choice_ok: are the words/vocabulary choices natural and idiomatic (not a wrong word, not a false-friend calque)?",
  "particle_or_agreement_ok: are particles/case markers (ja/ko) or gender-number agreement (es/fr) correct?",
  "verb_form_ok: is the conjugation/verb form grammatically correct for the intended meaning?",
  "word_order_ok: is the word order natural for the language?",
  "register_consistent: is the register (plain/polite, formality) internally consistent, with no mixing?",
];

// ---------------------------------------------------------------------------
// Variant: schema builder + system prompt + user message builder.
// Each variant exports buildSchema(lang), buildSystemPrompt(lang),
// buildUserMessage(lang, rows) -> string, and deriveVerdict(parsedRow) for
// checklist-style variants (baseline/rationale-first/fewshot pass through).
// ---------------------------------------------------------------------------

function schemaBaseline() {
  return {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row_id: { type: "string" },
            verdict: { type: "string", enum: ["natural", "unnatural"] },
            reason: { type: "string", maxLength: 220 },
          },
          required: ["row_id", "verdict", "reason"],
        },
      },
    },
    required: ["verdicts"],
  };
}

function schemaRationaleFirst() {
  // Same fields, reason BEFORE verdict in the schema's property order --
  // for models whose constrained decoding fills fields in declared order,
  // this forces the rationale to be generated before the verdict token.
  return {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row_id: { type: "string" },
            reason: { type: "string", maxLength: 220 },
            verdict: { type: "string", enum: ["natural", "unnatural"] },
          },
          required: ["row_id", "reason", "verdict"],
        },
      },
    },
    required: ["verdicts"],
  };
}

function schemaChecklist() {
  return {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row_id: { type: "string" },
            word_choice_ok: { type: "boolean" },
            particle_or_agreement_ok: { type: "boolean" },
            verb_form_ok: { type: "boolean" },
            word_order_ok: { type: "boolean" },
            register_consistent: { type: "boolean" },
            reason: { type: "string", maxLength: 220 },
          },
          required: [
            "row_id",
            "word_choice_ok",
            "particle_or_agreement_ok",
            "verb_form_ok",
            "word_order_ok",
            "register_consistent",
            "reason",
          ],
        },
      },
    },
    required: ["verdicts"],
  };
}

function userMessageCommon(lang, rows, extraPreamble) {
  const compact = rows.map((r) => ({ row_id: r.id, sentence: r.sentence }));
  return (
    (extraPreamble ? extraPreamble + "\n\n" : "") +
    `Judge these ${LANG_NAMES[lang]} sentences. Return exactly one verdict per row_id, in the same order, row_id copied exactly:\n` +
    JSON.stringify(compact)
  );
}

export const VARIANTS = {
  baseline: {
    buildSchema: () => schemaBaseline(),
    buildSystemPrompt: (lang) =>
      baseInstruction(lang) +
      ` Return verdict "natural" or "unnatural" and a short reason for each row.`,
    buildUserMessage: (lang, rows) => userMessageCommon(lang, rows),
    // baseline reads verdict directly off the parsed row.
    deriveVerdict: (row) => row.verdict,
  },

  "rationale-first": {
    buildSchema: () => schemaRationaleFirst(),
    buildSystemPrompt: (lang) =>
      baseInstruction(lang) +
      ` For each row, FIRST write a one-line reason explaining what you checked (word choice, particles/agreement, conjugation, word order, register), THEN commit to a verdict of "natural" or "unnatural" that follows from that reason. Do not state the verdict before you have written the reason.`,
    buildUserMessage: (lang, rows) => userMessageCommon(lang, rows),
    deriveVerdict: (row) => row.verdict,
  },

  "binary-checklist": {
    buildSchema: () => schemaChecklist(),
    buildSystemPrompt: (lang) =>
      baseInstruction(lang) +
      ` Instead of one holistic judgment, answer these ${CHECKLIST_QUESTIONS.length} yes/no (true/false) questions per row:\n` +
      CHECKLIST_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n") +
      `\nAnswer each as a boolean (true = OK/passes, false = fails), plus a one-line reason citing whichever question(s) failed (or "all checks pass" if true).`,
    buildUserMessage: (lang, rows) => userMessageCommon(lang, rows),
    // Derived, not asked directly: unnatural iff ANY checklist question is false.
    deriveVerdict: (row) =>
      row.word_choice_ok &&
      row.particle_or_agreement_ok &&
      row.verb_form_ok &&
      row.word_order_ok &&
      row.register_consistent
        ? "natural"
        : "unnatural",
  },

  fewshot: {
    buildSchema: () => schemaRationaleFirst(),
    buildSystemPrompt: (lang) =>
      baseInstruction(lang) +
      ` For each row, FIRST write a one-line reason, THEN commit to a verdict of "natural" or "unnatural" that follows from that reason.`,
    buildUserMessage: (lang, rows) => {
      const examples = FEWSHOT_EXAMPLES[lang] ?? [];
      const preamble =
        `${examples.length} calibration examples (reference only — do not emit rows for these):\n` +
        JSON.stringify(examples);
      return userMessageCommon(lang, rows, preamble);
    },
    deriveVerdict: (row) => row.verdict,
  },
};

export function getVariant(name) {
  const v = VARIANTS[name];
  if (!v) {
    throw new Error(`unknown prompt variant "${name}"; known: ${Object.keys(VARIANTS).join(", ")}`);
  }
  return v;
}

export const VARIANT_NAMES = Object.keys(VARIANTS);
