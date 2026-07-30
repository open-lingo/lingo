/**
 * Japanese sentence templates — the madlibs skeletons for tailored practice.
 *
 * Each pattern carries the grammar (particles は/を/が/に, polite verb form,
 * word order) as fixed kana; slots are NOUNS/ADJECTIVES only, so the sentence
 * stays grammatical with any in-POS filler. `readingPattern` gives the romaji
 * skeleton (は→wa, を→o, へ etc.) since the fixed kana isn't itself a reading.
 *
 * Gates are honest: a template is only offered once the learner has reached the
 * module whose grammar it needs. Simple copula patterns gate at m3; verb-object
 * patterns at m7.
 */
import type { SentenceTemplate } from "@/features/practice/engine/types";

export const JA_TEMPLATES: SentenceTemplate[] = [
  // ── Copula (m3–m4) ──────────────────────────────────────────────────────
  {
    id: "ja-kore-wa-x-desu",
    pattern: "これは {x}です",
    readingPattern: "kore wa {x} desu",
    translationPattern: "This is {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 3 },
  },
  {
    id: "ja-sore-wa-x-desu",
    pattern: "それは {x}です",
    readingPattern: "sore wa {x} desu",
    translationPattern: "That is {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 3 },
  },
  {
    id: "ja-x-wa-y-desu",
    pattern: "{x}は {y}です",
    readingPattern: "{x} wa {y} desu",
    translationPattern: "{x} is {y}.",
    slots: [
      { key: "x", pos: "noun" },
      { key: "y", pos: "noun" },
    ],
    grammarGate: { minModule: 4 },
  },
  {
    id: "ja-kore-wa-x-ja-arimasen",
    pattern: "これは {x}じゃ ありません",
    readingPattern: "kore wa {x} ja arimasen",
    translationPattern: "This is not {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 4 },
  },
  // ── Questions / shopping (m5) ────────────────────────────────────────────
  {
    id: "ja-x-wa-doko-desu-ka",
    pattern: "{x}は どこですか",
    readingPattern: "{x} wa doko desu ka",
    translationPattern: "Where is {x}?",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 5 },
  },
  {
    id: "ja-x-wa-ikura-desu-ka",
    pattern: "{x}は いくらですか",
    readingPattern: "{x} wa ikura desu ka",
    translationPattern: "How much is {x}?",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 5 },
  },
  {
    id: "ja-x-o-kudasai",
    pattern: "{x}を ください",
    readingPattern: "{x} o kudasai",
    translationPattern: "{x}, please.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 5 },
  },
  // ── Existence (m6) ────────────────────────────────────────────────────────
  {
    id: "ja-x-ga-arimasu",
    pattern: "{x}が あります",
    readingPattern: "{x} ga arimasu",
    translationPattern: "There is {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 6 },
  },
  {
    id: "ja-koko-ni-x-ga-arimasu",
    pattern: "ここに {x}が あります",
    readingPattern: "koko ni {x} ga arimasu",
    translationPattern: "There is {x} here.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 6 },
  },
  // ── Verbs + object/goal (m7) ──────────────────────────────────────────────
  {
    id: "ja-x-o-tabemasu",
    pattern: "{x}を たべます",
    readingPattern: "{x} o tabemasu",
    translationPattern: "I eat {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  {
    id: "ja-x-o-nomimasu",
    pattern: "{x}を のみます",
    readingPattern: "{x} o nomimasu",
    translationPattern: "I drink {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  {
    id: "ja-x-ni-ikimasu",
    pattern: "{x}に いきます",
    readingPattern: "{x} ni ikimasu",
    translationPattern: "I go to {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  {
    id: "ja-mainichi-x-o-tabemasu",
    pattern: "まいにち {x}を たべます",
    readingPattern: "mainichi {x} o tabemasu",
    translationPattern: "I eat {x} every day.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  {
    id: "ja-x-ga-suki-desu",
    pattern: "{x}が すきです",
    readingPattern: "{x} ga suki desu",
    translationPattern: "I like {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 7 },
  },
  // ── Adjectives (m8) ───────────────────────────────────────────────────────
  {
    id: "ja-x-wa-adj-desu",
    pattern: "{x}は {adj}です",
    readingPattern: "{x} wa {adj} desu",
    translationPattern: "{x} is {adj}.",
    slots: [
      { key: "x", pos: "noun" },
      { key: "adj", pos: "adjective" },
    ],
    grammarGate: { minModule: 8 },
  },
  {
    id: "ja-kono-x-wa-oishii-desu",
    pattern: "この {x}は おいしいです",
    readingPattern: "kono {x} wa oishii desu",
    translationPattern: "This {x} is delicious.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 8 },
  },
];
