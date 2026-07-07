import { describe, it, expect } from "vitest";
import grammarPointsJson from "./n5-grammar-points.json";
import type { GrammarPoint } from "@/features/flashcards/engine/grammarSrs";
import type { LessonStep } from "../types";
import type { SRSCardState, SRSModalityState } from "@/features/flashcards/data/types";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";
import { grammarRule } from "@/features/languages/ja/grammarHelpers";
import {
  AUTHORED_GRAMMAR_POOLS,
  getGrammarPool,
  pickPoolStep,
  getGrammarRuleStepForPoint,
  pointsBelowMinPool,
  MIN_POOL_SIZE,
} from "./grammarReviewPools";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];
const SHIPPED = GRAMMAR_POINTS.filter((p) => p.status === "shipped");

// ── SRS fixture helpers ────────────────────────────────────────────────────
function modalityState(reps: number): SRSModalityState {
  return {
    stability: 1, difficulty: 5, state: "review", interval: 1,
    dueDate: "2026-01-01", lastReviewDate: "2026-01-01", reps, lapses: 0,
  };
}
/** Fabricate a card whose (recognition.reps + production.reps) === repsSum. */
function stateWithReps(repsSum: number): SRSCardState {
  return { recognition: modalityState(repsSum), production: modalityState(0) };
}

// ── Comprehensibility gate helpers (spec §1.1) ─────────────────────────────
// PUNCT_RE extends the spec set with Latin letters/quotes/parens: a handful of
// harvested clozes embed an English gloss in the after-text (e.g. "(It's my
// pen.)"). English is not Japanese vocab to gate — the one defensible
// tokenization extension made here (brief §1.5).
const PUNCT_RE = /[。、？！?!「」・〜ー…\s0-9０-９A-Za-z'’().,]/g;
// Endings/copulas the course teaches explicitly; extend ONLY with taught forms.
// Counter suffixes (じ/ふん/ぷん/こ/まい/ほん/ぼん/ぽん/さい/はい/ばい/ぱい/にん) are
// added because each is a bound morpheme the course teaches head-on as its own
// shipped grammar point (counter-ji, counter-fun, …). Unlike verb/adjective
// conjugation endings, appending a counter to a number atom leaves NO stem
// residue (さん + じ = さんじ, both fully explained), so this admits genuine
// counter drills without loosening the gate for anything else — greedy
// longest-match still strips real words (じかん, ほん=book) before the bare
// suffix. Any counter drill still needs its number to be a known atom.
const COUNTER_SUFFIXES = ["じ", "ふん", "ぷん", "こ", "まい", "ほん", "ぼん", "ぽん",
  "さい", "はい", "ばい", "ぱい", "にん"];
const TAUGHT_ENDINGS = ["ます", "ません", "ました", "ませんでした", "です", "でした",
  "じゃない", "じゃありません", "ください", "でしょう", ...COUNTER_SUFFIXES];
function moduleOrder(m: string): number { const x = /^m(\d+)$/.exec(m); return x ? +x[1] : Infinity; }

/** Split "/"、"、"-separated kana/kanji variants (moduleConformance pattern). */
function surfaceVariants(atom: { kana: string; kanji?: string }): string[] {
  const out = atom.kana.split(/[/、]/).map((s) => s.trim());
  if (atom.kanji) out.push(...atom.kanji.split(/[/、]/).map((s) => s.trim()));
  return out.filter(Boolean);
}

function stepSentence(step: LessonStep): string {
  const s = step as unknown as {
    prompt?: { before?: string; after?: string };
    correctParticle?: string;
    promptAudioText?: string;
    options?: { id: string; text: string }[];
    correctOptionId?: string;
    targetSentence?: string;
  };
  switch (step.type) {
    case "particle_cloze":
      return `${s.prompt?.before ?? ""}${s.correctParticle ?? ""}${s.prompt?.after ?? ""}`;
    case "multiple_choice": {
      const correct = s.options?.find((o) => o.id === s.correctOptionId);
      return `${s.promptAudioText ?? ""}${correct?.text ?? ""}`;
    }
    case "listening_build":
    case "build_sentence":
      return s.targetSentence ?? "";
    default:
      return "";
  }
}

/** Greedy longest-match residual after removing punctuation, all atoms with
 *  fromModule ≤ ceiling, taught endings, and the point token. "" = fully
 *  explained by course content at that module. */
function gateResidual(sentence: string, pointModule: string, pointToken: string): string {
  const allowed = JA_COURSE_ATOMS
    .filter((a) => moduleOrder(a.fromModule) <= moduleOrder(pointModule))
    .flatMap((a) => surfaceVariants(a))
    .concat(TAUGHT_ENDINGS, [pointToken])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let residual = sentence.replace(PUNCT_RE, "");
  for (const surface of allowed) residual = residual.split(surface).join("");
  return residual;
}

/**
 * GATE_EXEMPTIONS — harvested `${pointId}::${stepId}` pairs that the naive
 * greedy-atom tokenizer flags but which are NOT content bugs (brief §1.5
 * classification). Every entry falls into one of three tokenizer limitations,
 * none a real "too-advanced vocab" authoring error:
 *   1. Verb conjugation is not modeled — いきます/かえります/たべます leave a
 *      stem (いき/かえ/たべ) because the atom is the dict form (いく/かえる/
 *      たべる) and only the bare ます ending is stripped. Dominant class.
 *   2. Several very common atoms carry a `fromModule` LATER than their first
 *      curricular use — わたし/これ/それ/あれ (m4) appear in m3 clozes;
 *      ペン(m12)/カメラ(m11)/コーヒー(m8)/ラーメン(m12) appear earlier — so a
 *      trivially-known word reads as "unexplained" at the point's module.
 *   3. Harvested clozes are attached to a point by particle match across the
 *      WHOLE course, so a later-module sentence (e.g. さかなは… from m21) hangs
 *      off an early point (wa-topic, m3) and is checked against m3 vocab.
 * These are harvested from shipped lessons already gated by moduleConformance
 * + kanaWordIntroOrder at their SOURCE module; the debt is a grammar-deck
 * concern (don't surface a later-vocab rotation to an early learner) handed to
 * Task 3's session builder (reached-module pool filter) / a conjugation-aware
 * gate. Frozen here as a ratchet: harvested debt cannot GROW. AUTHORED
 * (ja-gpool-*) steps are never exempted here — they are held to the zero-
 * residual STRICT gate in the "every AUTHORED (ja-gpool-*) pool step is
 * comprehensible" test below, which permits no exemption list at all.
 */
const GATE_EXEMPTIONS: string[] = [
  "de-action::ja-m6-2-2-cloze-de-foil",
  "de-action::ja-m6-3-1-cloze-1",
  "de-action::ja-m6-3-1-cloze-2",
  "de-action::ja-m6-3-1-cloze-4",
  "de-action::ja-m6-3-2-cloze-1",
  "de-action::ja-m6-3-2-cloze-2",
  "de-action::ja-m6-5-1-cloze-2",
  "de-action::ja-m6-5-1-cloze-3",
  "de-action::ja-m6-5-1-cloze-5",
  "de-action::ja-m6-5-2-cloze-2",
  "de-action::ja-m6-6-1-cloze-3",
  "de-action::ja-m6-6-2-cloze-3",
  "de-action::ja-m6-8-2-cloze-3",
  "de-action::ja-m6-story-cloze-de",
  "deshou::ja-m18-2-1-cloze-deshou-1",
  "deshou::ja-m18-5-1-cloze-deshou",
  "e-direction::ja-m17-3-1-cloze-e",
  "e-direction::ja-m17-6-1-cloze-e",
  "e-direction::ja-m17-7-1-cloze-e",
  "ga-existence::ja-m6-4-1-cloze-2",
  "ga-existence::ja-m6-4-1-cloze-3",
  "ga-existence::ja-m6-6-1-cloze-4",
  "ga-existence::ja-m6-8-2-cloze-1",
  "ga-existence::ja-m8-4-2-cloze-ha-1",
  "ga-existence::ja-m8-7-1-cloze-ha",
  "ichiban-superlative::ja-m22-3-2-cloze-ichiban",
  "ka-question::ja-m3-2-2-cloze-ka",
  "ka-question::ja-m3-3-2-cloze-ka",
  "ka-question::ja-m3-4-1-cloze-4",
  "ka-question::ja-m3-5-1-cloze-4",
  "ka-question::ja-m3-5-2-cloze-1",
  "ka-question::ja-m4-1-2-cloze-ka",
  "ka-question::ja-m4-7-2-cloze-final",
  "kedo::ja-m15-6-1-cloze-kedo-1",
  "kedo::ja-m15-6-1-cloze-kedo-2",
  "kedo::ja-m15-6-2-cloze-combo-1",
  "kedo::ja-m15-6-2-cloze-combo-2",
  "kudasai::ja-m5-3-2-cloze-1",
  // "made-ni::ja-m17-5-1-cloze-madeni-1" — dropped: now fully decomposes once
  // the taught counter suffixes (じ) are recognised (5時までに…), so it is no
  // longer flagged and would rot the ratchet as a stale exemption.
  "made-ni::ja-m17-6-1-cloze-madeni",
  "made-ni::ja-m17-7-1-cloze-madeni-2",
  "made-ni::ja-m17-story-cloze-1",
  "made-until::ja-m13-3-1-cloze-made-1",
  "made-until::ja-m13-3-1-cloze-made-2",
  "made-until::ja-m13-3-2-cloze-made-2",
  "made-until::ja-m13-6-2-cloze-made",
  "made-until::ja-m13-7-1-cloze-made",
  "mae-ni::ja-m17-6-1-cloze-maeni",
  "masenka::ja-m23-3-1-cloze-masenka",
  "masenka::ja-m23-4-1-cloze-masenka",
  "masenka::ja-m23-5-2-cloze-masenka",
  "masenka::ja-m23-7-1-cloze-1",
  "masenka::ja-m23-7-2-cloze-2",
  "mashou::ja-m23-2-2-cloze-mashou",
  "mashou::ja-m23-4-1-cloze-mashou",
  "mashou::ja-m23-4-2-cloze-mashou",
  "mashou::ja-m23-5-1-cloze-mashou",
  "mashou::ja-m23-5-2-cloze-mashou",
  "mashou::ja-m23-7-2-cloze-1",
  "mashou::ja-m23-story-cloze-1",
  "masu-past::ja-m10-1-1-cloze-mashita",
  "masu-past::ja-m10-2-1-cloze-mashita-oki",
  "masu-past::ja-m10-2-2-cloze-mashita-hashiri",
  "masu-past::ja-m10-7-1-cloze-mashita",
  "masu-past::ja-m10-7-2-cloze-mixed",
  "ni-location::ja-m6-2-1-cloze-1",
  "ni-location::ja-m6-2-1-cloze-3",
  "ni-location::ja-m6-2-1-cloze-4",
  "ni-location::ja-m6-5-1-cloze-1",
  "ni-location::ja-m6-5-1-cloze-4",
  "ni-location::ja-m6-5-2-cloze-1",
  "ni-location::ja-m6-5-2-cloze-3",
  "ni-location::ja-m6-6-1-cloze-5",
  "ni-location::ja-m6-6-2-cloze-2",
  "ni-location::ja-m7-3-2-cloze-4",
  "ni-location::ja-m7-6-1-cloze-3",
  "ni-location::ja-m7-8-2-cloze-2",
  "no-possession::ja-m4-2-1-cloze-3",
  "no-possession::ja-m4-2-2-cloze-2",
  "no-possession::ja-m4-4-2-cloze-no",
  "no-possession::ja-m4-6-1-cloze-dare",
  "no-possession::ja-m4-7-1-warmup-cloze",
  "no-possession::ja-m4-7-2-cloze-1",
  "no-possession::ja-m4-story-cloze-no",
  "node-because::ja-m20-4-1-cloze-node-1",
  "node-because::ja-m20-4-2-cloze-node",
  "node-because::ja-m20-5-1-cloze-node",
  "node-because::ja-m20-5-2-cloze-node",
  "node-because::ja-m20-6-2-cloze-node",
  "to-and::ja-m8-3-1-cloze-to",
  "to-and::ja-m8-3-2-cloze-to-2",
  "to-and::ja-m8-7-1-cloze-to",
  "to-and::ja-m8-7-2-cloze-to",
  "to-and::ja-m8-story-cloze-to",
  "toki::ja-m25-5-1-cloze-1",
  "toki::ja-m25-5-1-cloze-2",
  "toki::ja-m25-5-1-cloze-3",
  "toki::ja-m25-5-2-cloze-1",
  "toki::ja-m25-5-2-cloze-2",
  "toki::ja-m25-6-1-cloze-3",
  "toki::ja-m25-6-2-cloze-1",
  "wa-topic::ja-m3-2-2-cloze-ha",
  "wa-topic::ja-m3-3-2-cloze-ha",
  "wa-topic::ja-m3-4-1-cloze-1",
  "wa-topic::ja-m3-4-1-cloze-3",
  "wa-topic::ja-m4-3-1-cloze-wa-vs-mo",
  "wa-topic::ja-m4-5-1-cloze-2",
  "wa-topic::ja-m4-6-2-cloze-ha",
  "wa-topic::ja-m5-6-1-cloze-2",
  "wa-topic::ja-m5-6-2-cloze-1",
  "wo-object::ja-m7-5-1-cloze-1",
  "wo-object::ja-m7-6-1-cloze-4",
  "wo-object::ja-m7-6-2-cloze-1",
  "wo-object::ja-m7-8-2-cloze-1",
  "wo-object::ja-m7-8-2-cloze-3",
  "wo-object::ja-m9-2-2-cloze-wo",
  "ya-incomplete-list::ja-m21-3-1-cloze-ya-1",
  "ya-incomplete-list::ja-m21-3-1-cloze-ya-2",
  "ya-incomplete-list::ja-m21-3-2-cloze-ya-1",
  "ya-incomplete-list::ja-m21-3-2-cloze-ya-2",
  "ya-incomplete-list::ja-m21-7-1-cloze-ya",
  "ya-incomplete-list::ja-m21-7-2-cloze-ya",
  "ya-incomplete-list::ja-m21-story-cloze-ya",
  "yo-emphasis::ja-m9-4-2-cloze-yo-1",
  "yo-emphasis::ja-m9-7-2-cloze-yo",
  "yori-comparison::ja-m22-5-1-cloze-yori",
  "yori-comparison::ja-m22-5-2-cloze-yori",
  "yori-comparison::ja-m22-6-2-cloze-yori",
];

describe("grammarReviewPools — rotation, merge, gate, plumbing", () => {
  describe("pickPoolStep — deterministic rotation", () => {
    it("rotates by (recognition.reps + production.reps) % pool.length", () => {
      // counter-nin has exactly 3 harvested steps → indices 0/1/2/0.
      const pool = getGrammarPool("counter-nin");
      expect(pool.length).toBe(3);
      expect(pickPoolStep("counter-nin", stateWithReps(0))!.id).toBe(pool[0].id);
      expect(pickPoolStep("counter-nin", stateWithReps(1))!.id).toBe(pool[1].id);
      expect(pickPoolStep("counter-nin", stateWithReps(2))!.id).toBe(pool[2].id);
      expect(pickPoolStep("counter-nin", stateWithReps(3))!.id).toBe(pool[0].id);
    });

    it("null state → pool[0]", () => {
      const pool = getGrammarPool("wa-topic");
      expect(pickPoolStep("wa-topic", null)!.id).toBe(pool[0].id);
    });

    it("is deterministic — same inputs, same step, no Date.now/Math.random", () => {
      const s = stateWithReps(7);
      const a = pickPoolStep("wa-topic", s);
      const b = pickPoolStep("wa-topic", s);
      expect(a!.id).toBe(b!.id);
      const pool = getGrammarPool("wa-topic");
      expect(a!.id).toBe(pool[7 % pool.length].id);
    });

    it("returns null for an empty pool", () => {
      expect(pickPoolStep("__no-such-point__", null)).toBeNull();
      expect(pickPoolStep("__no-such-point__", stateWithReps(2))).toBeNull();
    });
  });

  describe("getGrammarPool — merge + dedupe", () => {
    it("never yields duplicate step ids for any shipped point", () => {
      for (const point of SHIPPED) {
        const ids = getGrammarPool(point.id).map((s) => s.id);
        expect(new Set(ids).size, `dup ids in ${point.id}`).toBe(ids.length);
      }
    });

    it("merges authored + harvested for a point in both sources — authored first, ids unique", () => {
      // `deshou` is authored by Task 2 AND has harvested でしょう clozes from
      // the m18 curriculum, so its merged pool genuinely draws on both sources.
      const authored = AUTHORED_GRAMMAR_POOLS["deshou"] ?? [];
      expect(authored.length).toBeGreaterThan(0);
      const pool = getGrammarPool("deshou");
      const harvestedInPool = pool.filter((s) => !s.id.startsWith("ja-gpool-"));
      expect(harvestedInPool.length, "expected harvested でしょう clozes too").toBeGreaterThan(0);
      // Authored entries come first, in order.
      expect(pool.slice(0, authored.length).map((s) => s.id)).toEqual(
        authored.map((s) => s.id),
      );
      // The union carries no duplicate step ids.
      const ids = pool.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("comprehensibility gate — Spencer's authoring law", () => {
    it("every AUTHORED (ja-gpool-*) pool step is comprehensible at its point's module", () => {
      // Load-bearing for Task 2: the strict gate over steps we control. Empty
      // in Task 1 (AUTHORED_GRAMMAR_POOLS = {}) → vacuously green; bites the
      // moment Task 2 authors a step with too-advanced vocab.
      const failures: string[] = [];
      for (const point of SHIPPED) {
        const authored = AUTHORED_GRAMMAR_POOLS[point.id] ?? [];
        for (const step of authored) {
          const sentence = stepSentence(step);
          if (!sentence) continue;
          const residual = gateResidual(sentence, point.module, point.point);
          if (residual !== "") {
            failures.push(`${point.id} ${step.id}: unexplained "${residual}" in "${sentence}"`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });

    it("harvested-pool comprehensibility debt is frozen — no new too-advanced steps", () => {
      // Ratchet: the set of harvested steps flagged by the gate must not grow
      // beyond the documented GATE_EXEMPTIONS. Any new incomprehensible
      // harvested step (or a mis-tagged authored one leaking in) trips this.
      const exempt = new Set(GATE_EXEMPTIONS);
      const flagged: string[] = [];
      for (const point of SHIPPED) {
        for (const step of getGrammarPool(point.id)) {
          if (step.id.startsWith("ja-gpool-")) continue; // authored → strict test above
          const sentence = stepSentence(step);
          if (!sentence) continue;
          if (gateResidual(sentence, point.module, point.point) !== "") {
            flagged.push(`${point.id}::${step.id}`);
          }
        }
      }
      const novel = flagged.filter((k) => !exempt.has(k)).sort();
      expect(novel, `NEW gate failures (not in GATE_EXEMPTIONS):\n${novel.join("\n")}`).toEqual([]);
      // Also guard against dead exemptions rotting the list.
      const flaggedSet = new Set(flagged);
      const stale = GATE_EXEMPTIONS.filter((k) => !flaggedSet.has(k)).sort();
      expect(stale, `STALE exemptions (no longer flagged — remove):\n${stale.join("\n")}`).toEqual([]);
    });
  });

  describe("pool-floor ratchet", () => {
    it("pointsBelowMinPool() equals POOL_GAP_EXEMPTIONS (Task 2 shrinks to [])", () => {
      expect([...pointsBelowMinPool()].sort()).toEqual([...POOL_GAP_EXEMPTIONS].sort());
    });

    it("MIN_POOL_SIZE is 3", () => {
      expect(MIN_POOL_SIZE).toBe(3);
    });
  });

  describe("grammarPointId plumbing", () => {
    it("grammarRule() carries grammarPointId through when provided", () => {
      const step = grammarRule({
        id: "ja-test-rule-1",
        title: "T", rule: "R",
        examples: [{ ja: "x", romaji: "x", en: "x" }],
        grammarPointId: "wa-topic",
      });
      expect(step.grammarPointId).toBe("wa-topic");
    });

    it("grammarRule() omits grammarPointId when not provided", () => {
      const step = grammarRule({
        id: "ja-test-rule-2",
        title: "T", rule: "R",
        examples: [{ ja: "x", romaji: "x", en: "x" }],
      });
      expect(step.grammarPointId).toBeUndefined();
    });

    it("getGrammarRuleStepForPoint finds a tagged rule from mockLessons content", () => {
      // wa-topic is tagged on its curriculum grammar_rule card (Task 1.4).
      const rule = getGrammarRuleStepForPoint("wa-topic");
      expect(rule).not.toBeNull();
      expect(rule!.type).toBe("grammar_rule");
      expect(rule!.grammarPointId).toBe("wa-topic");
    });

    it("returns null for a point with no tagged rule card", () => {
      // kanji-set-1 is a planned point with no authored rule card.
      expect(getGrammarRuleStepForPoint("kanji-set-1")).toBeNull();
      expect(getGrammarRuleStepForPoint("__no-such-point__")).toBeNull();
    });
  });
});

/** Shipped points (module ≤ m27) whose merged pool is still below
 *  MIN_POOL_SIZE after Task 2 authored `AUTHORED_GRAMMAR_POOLS`.
 *
 *  Task 2 authored pools for 37 points (copula, demonstratives, numbers,
 *  na-adjective forms, i-adjective present, adverbs, から/に particles, desire/
 *  ability/preference patterns, modals whose token strips cleanly, superlative,
 *  family register, change-of-state, and every counter). The residue below is
 *  ALL conjugation-formation points, left exempt on principle:
 *
 *  The comprehensibility gate decomposes a sentence by greedily stripping
 *  course atoms. Atoms are stored in DICTIONARY form (たべる, たかい). A
 *  conjugated surface therefore leaves an un-strippable stem — たべて → strip
 *  the point token but たべ remains (the atom is たべる, not たべ); たかくない →
 *  たか remains. No taught-ending addition can rescue this (the stem, not the
 *  ending, is unexplained), and we may NOT add conjugated atoms or weaken the
 *  gate. So a point whose ENTIRE reviewable content is producing a conjugated
 *  form cannot be exercised by an honest sentence that passes the gate. These
 *  are exactly the points a future conjugation-aware gate / Conjugation Trainer
 *  (retention §10) would unblock — flagged, not forced.
 *
 *  One vocab-gap exception: `to-quotation` — the quotative と needs a verb of
 *  saying (いう/いいます), which the curriculum doesn't introduce until after
 *  m21 (いう is `fromModule: "future"`); no comprehensible host verb exists at
 *  the point's module.
 */
const POOL_GAP_EXEMPTIONS: string[] = [
  // ── i-adjective conjugation (stem not an atom: たか-, さむ-) ──
  "i-adj-negative", // 〜くない
  "i-adj-past", // 〜かった
  "i-adj-past-negative", // 〜くなかった
  // ── plain / polite-negative verb conjugation (stem not an atom: たべ-) ──
  "ta-form", // plain past 〜た
  "nai-form", // plain negative 〜ない
  "masu-negative", // 〜ません
  "masu-past-negative", // 〜ませんでした
  // ── て-form and everything built on it (て-stem not an atom) ──
  "te-form",
  "te-kudasai",
  "te-iru",
  "te-mo-ii",
  "te-wa-ikemasen",
  "naide-kudasai",
  "te-kara",
  // ── stem-attaching modals / aux (masu-stem or ta-form base not an atom) ──
  "v-tai", // ます-stem + たい
  "sugiru", // stem + すぎる
  "ni-iku", // ます-stem + にいく
  "koto-ga-aru", // た-form + ことがある
  "tari-tari-suru", // た-form + り
  "nakereba-naranai", // ない-stem + ければならない
  "hou-ga-ii", // た-form / ない + ほうがいい
  // ── vocab gap: no saying-verb atom (いう/いいます) by m21 ──
  "to-quotation",
];
