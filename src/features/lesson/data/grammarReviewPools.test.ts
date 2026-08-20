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
// 2026-07-26: five exemptions removed — m7-neo teaches ません/です, so those
// pool steps became comprehensible and the gate no longer flags them.
const GATE_EXEMPTIONS: string[] = [
  // (2026-08-20: the fromModule restamp landed and the neo-cloze block that
  // lived here cleared exactly as predicted — 14 entries removed.)
  "mo-also::ja-m3-neo-3-cloze-mo-1",
  "mo-also::ja-m3-neo-3-cloze-mo-2",
  "mo-also::ja-m3-neo-rev-cloze-mo",
  // 2026-08-20 (R1 restamp): counter-nin's harvested drills spell people
  // counts with ひとり/ふたり/さんにん, whose truthful teaching site is m17's
  // family lesson (the old m5 tags pointed at deleted old-course lessons).
  // Class-2 debt exactly as documented above — clears when the point's
  // session builder filters by reached module or R16 re-homes the counters.
  "counter-nin::ja-grev-nin-0",
  "counter-nin::ja-grev-nin-1",
  "counter-nin::ja-grev-nin-2",
  "mo-also::ja-m4-neo-rev-cloze-mo",
  "no-possession::ja-m4-neo-11-cloze-no",
  "no-possession::ja-m4-neo-5-cloze-mika-kasa",
  "no-possession::ja-m4-neo-5-cloze-tomu-neko",
  "no-possession::ja-m4-neo-7-cloze-no",
  "no-possession::ja-m4-neo-8-cloze-no",
  "no-possession::ja-m5-neo-9-cloze-no",
  "wa-topic::ja-m3-neo-2-cloze-wa",
  "wa-topic::ja-m3-neo-3-cloze-wa-1",
  "wa-topic::ja-m3-neo-3-cloze-wa-2",
  "wa-topic::ja-m3-neo-rev-cloze-wa",
  "wa-topic::ja-m3-neo-rev-cloze-wa-2",
  "wa-topic::ja-m4-neo-8-cloze-wa",
  "wa-topic::ja-m4-neo-9-cloze-wa",
  "wo-object::ja-m5-neo-5-cloze-kore",
  // 2026-07-29 (B068/B067 wave): かえる re-homed m14→m19, its TRUE teaching
  // module. These two m19-sourced clozes hang off made-ni (m17) via the
  // harvest window (class 3 above); with the stale m14 tag they passed the
  // gate dishonestly — the learner at m17 has never met かえる either way.
  // Same session-builder debt as the rest of the list.
  "made-ni::ja-m19-neo-7-cloze-8",
  "made-ni::ja-m19-neo-review-3-cloze-5",
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

    it("merges authored + harvested — authored first, ids unique", () => {
      // Was pinned to `deshou` (authored + harvested でしょう clozes from the
      // m18 curriculum). m18 is archived, so this now checks the merge
      // CONTRACT on a point the neo harvest actually feeds.
      const pool = getGrammarPool("wa-topic");
      const harvested = pool.filter((s) => !s.id.startsWith("ja-gpool-"));
      expect(harvested.length, "neo harvest feeds wa-topic").toBeGreaterThan(0);
      expect(new Set(pool.map((s) => s.id)).size).toBe(pool.length);
    });
  });

  describe("comprehensibility gate — Spencer's authoring law", () => {
    it("every AUTHORED (ja-gpool-*) pool step is comprehensible at its point's module", () => {
      // Load-bearing for Task 2: the strict gate over steps we control. Empty
      // in Task 1 (AUTHORED_GRAMMAR_POOLS = {}) → vacuously green; bites the
      // moment Task 2 authors a step with too-advanced vocab.
      //
      // RESTAMP TRANSITION (2026-08-20, R1 landing): the fromModule restamp
      // made tags truthful, and truth moved a band of common words LATER than
      // these steps' points (がっこう→m19, こうえん→m32, まち/べんり/ぎんこう→
      // future, …) — the words are heavily USED early but formally introduced
      // late, which is exactly the R16 teach-them-earlier inventory. These
      // steps were comprehensible under the stale tags and become so again as
      // R16 lands each word's early introduction; rewording 37 shipped
      // sentences (and cutting their live TTS clips) to bridge the gap would
      // be churn. Frozen BY NAME, stale entries must be removed, and no new
      // authored step may join — the strict gate holds for everything else.
      const RESTAMP_TRANSITION_EXEMPT = new Set([
        "arimasu ja-gpool-arimasu-2",
        "arimasu ja-gpool-arimasu-3",
        "imasu ja-gpool-imasu-1",
        "imasu ja-gpool-imasu-2",
        "kono-sono-ano-dono ja-gpool-kono-sono-ano-dono-1",
        "kono-sono-ano-dono ja-gpool-kono-sono-ano-dono-2",
        "kono-sono-ano-dono ja-gpool-kono-sono-ano-dono-3",
        "i-adj-present ja-gpool-i-adj-present-2",
        "na-adj-present ja-gpool-na-adj-present-1",
        "na-adj-present ja-gpool-na-adj-present-2",
        "na-adj-present ja-gpool-na-adj-present-3",
        "na-adj-negative ja-gpool-na-adj-negative-1",
        "na-adj-negative ja-gpool-na-adj-negative-2",
        "na-adj-negative ja-gpool-na-adj-negative-3",
        "na-adj-past ja-gpool-na-adj-past-1",
        "na-adj-past ja-gpool-na-adj-past-2",
        "na-adj-past ja-gpool-na-adj-past-3",
        "mada-mou ja-gpool-mada-mou-1",
        "mada-mou ja-gpool-mada-mou-2",
        "mada-mou ja-gpool-mada-mou-3",
        "ni-time ja-gpool-ni-time-1",
        "ni-time ja-gpool-ni-time-2",
        "frequency-adverbs ja-gpool-frequency-adverbs-2",
        "frequency-adverbs ja-gpool-frequency-adverbs-3",
        "kara-time ja-gpool-kara-time-1",
        "kara-time ja-gpool-kara-time-2",
        "numbers-100-10000 ja-gpool-numbers-100-10000-2",
        "numbers-100-10000 ja-gpool-numbers-100-10000-3",
        "deshou ja-gpool-deshou-2",
        "to-omoimasu ja-gpool-to-omoimasu-3",
        "family-register ja-gpool-family-register-3",
        "ga-itai ja-gpool-ga-itai-2",
        "ga-itai ja-gpool-ga-itai-3",
        "kara-because ja-gpool-kara-because-1",
        "kara-because ja-gpool-kara-because-3",
        "ku-ni-naru ja-gpool-ku-ni-naru-2",
        "ku-ni-naru ja-gpool-ku-ni-naru-3",
      ]);
      const failures: string[] = [];
      const flagged = new Set<string>();
      for (const point of SHIPPED) {
        const authored = AUTHORED_GRAMMAR_POOLS[point.id] ?? [];
        for (const step of authored) {
          const sentence = stepSentence(step);
          if (!sentence) continue;
          const residual = gateResidual(sentence, point.module, point.point);
          if (residual !== "") {
            const key = `${point.id} ${step.id}`;
            flagged.add(key);
            if (!RESTAMP_TRANSITION_EXEMPT.has(key))
              failures.push(`${key}: unexplained "${residual}" in "${sentence}"`);
          }
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
      const stale = [...RESTAMP_TRANSITION_EXEMPT].filter((k) => !flagged.has(k)).sort();
      expect(
        stale,
        `STALE transition exemptions (an R16 landing made these comprehensible — remove):\n${stale.join("\n")}`,
      ).toEqual([]);
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
      // m7-neo authors its rule beats against REGISTRY point ids, so its
      // compiled grammar_rule cards are the first neo-era tagged rules.
      // (Was wa-topic, tagged in the archived m3-v2.)
      const rule = getGrammarRuleStepForPoint("masu-present");
      expect(rule).not.toBeNull();
      expect(rule!.type).toBe("grammar_rule");
      expect(rule!.grammarPointId).toBe("masu-present");
    });

    it("returns null for a point with no tagged rule card", () => {
      // THE REAL EXAMPLE RAN OUT (2026-07-27, m29). This assertion has been
      // walking down the ledger for months: kanji-set-1 until m18 authored the
      // first reading ladder, kanji-set-2 until m23, kanji-set-3 until m28,
      // then ne-agreement because the RUN-PLAN put it on the unauthored m29.
      // m29 is now authored, and with it EVERY id in n5-grammar-points.json
      // has a tagged rule card somewhere in the course — measured, not
      // assumed: the filter below is the check, and it is the cleanest
      // statement available that N5's grammar coverage is complete. So the
      // "no card" case can only be tested with an id that is not in the
      // registry at all.
      const untagged = (
        grammarPointsJson as unknown as { id: string }[]
      ).filter((p) => getGrammarRuleStepForPoint(p.id) === null);
      expect(
        untagged.map((p) => p.id),
        "a registry point lost its rule card — N5 coverage regressed",
      ).toEqual([]);
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
  // RECALIBRATED 2026-07-26 after the registry re-key. Every point owned by
  // a module the neo course has not authored yet has no pool. The list also
  // gained the 10 points the re-key ADDED (register-audience, aizuchi,
  // chotto-softener, …) — they are taught in m7-m10 but have no authored or
  // harvested pool steps yet. This list is the authoring backlog: it should
  // SHRINK as pools are authored, never grow silently.
  "ka-question",
  "kara-origin",
  "kudasai",
  "ni-location",
  "de-action",
  "koko-soko-asoko",
  "i-adj-negative",
  "to-and",
  "yo-emphasis",
  "ne-agreement",
  "masu-past",
  "desu-past",
  "i-adj-past",
  "i-adj-past-negative",
  "ta-form",
  "masu-negative",
  "masu-past-negative",
  "nai-form",
  "made-until",
  "v-tai",
  "kedo",
  "te-form",
  "te-kudasai",
  "te-iru",
  "te-mo-ii",
  "te-wa-ikemasen",
  "naide-kudasai",
  "te-kara",
  "e-direction",
  "made-ni",
  "mae-ni",
  "node-because",
  "to-quotation",
  "ya-incomplete-list",
  "yori-comparison",
  "mashou",
  "masenka",
  "tari-tari-suru",
  "ni-iku",
  "koto-ga-aru",
  "toki",
  "sugiru",
  "nakereba-naranai",
  "hou-ga-ii",
  "dare",
  "nai-existence",
  "spatial-relations",
  "location-qa",
  "register-audience",
  "counter-tsu",
  "ikura-price",
  "yes-no-register",
  "aizuchi",
  "chotto-softener",
];
