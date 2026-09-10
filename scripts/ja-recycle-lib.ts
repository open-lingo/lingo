/**
 * Pure classification/aggregation core for `ja-recycle-rate.ts` (2026-09-09).
 *
 * Deliberately dependency-free (no `@/...` imports, not even type-only ones)
 * so `ja-recycle-rate.test.ts` can exercise it under a minimal vitest config
 * with no alias resolution and no app boot. The runner script
 * (`ja-recycle-rate.ts`) does the real work of compiling modules with the
 * app's own `compileModule()` + tokenizer and hands this module already-
 * tokenized sentences; this file only knows how to CLASSIFY tokens and
 * AGGREGATE the recycle-rate stats — no Japanese-specific tokenization logic
 * lives here, so there is nothing here that can silently drift from the real
 * tokenizer's behavior.
 */

export type PosClass = "verb" | "noun" | "adjective" | "other";

export type AtomMeta = {
  /** Coarse content-word bucket. Only verb/noun/adjective count toward
   *  recycle rate; everything else (particles, copula, names, adverbs,
   *  interjections, unclassified fragments) is "other" and ignored. */
  pos: PosClass;
  /** First module (as a bare integer, e.g. 31 for "m31") that taught this
   *  atom's LEMMA — already resolved through any verb-form/adj-form
   *  `derivedFrom` chain by the caller. `null` = unknown/unattributable
   *  (future-tagged, course furniture, or a token the registry has never
   *  seen — never counts as "earlier"). */
  fromModule: number | null;
};

export type Classifier = (token: string) => AtomMeta;

/** The same "is this a real sentence, not a bare word" heuristic
 *  `moduleCompiler.ts` uses for its own filler dedup (`x.ja.trim().split(...)
 *  .length >= 3`) — kept in lockstep on purpose so this script's sentence
 *  set matches what the compiler itself treats as sentence-level content. */
export function isSentence(ja: string): boolean {
  return ja.trim().split(/[\s　]+/).filter(Boolean).length >= 3;
}

export type SentenceStat = {
  tokens: string[];
  hasEarlierVerb: boolean;
  hasEarlierNoun: boolean;
  hasEarlierAdjective: boolean;
  hasAnyEarlier: boolean;
};

/**
 * Classify one already-tokenized sentence against `moduleNum` (the module
 * this sentence lives in). A token counts as "earlier" only when its
 * classified `fromModule` is a real integer strictly less than `moduleNum`.
 */
export function analyzeSentence(
  tokens: string[],
  moduleNum: number,
  classify: Classifier,
): SentenceStat {
  let hasEarlierVerb = false;
  let hasEarlierNoun = false;
  let hasEarlierAdjective = false;
  for (const t of tokens) {
    const meta = classify(t);
    if (meta.fromModule == null || meta.fromModule >= moduleNum) continue;
    if (meta.pos === "verb") hasEarlierVerb = true;
    else if (meta.pos === "noun") hasEarlierNoun = true;
    else if (meta.pos === "adjective") hasEarlierAdjective = true;
  }
  return {
    tokens,
    hasEarlierVerb,
    hasEarlierNoun,
    hasEarlierAdjective,
    hasAnyEarlier: hasEarlierVerb || hasEarlierNoun || hasEarlierAdjective,
  };
}

export type RecycleSummary = {
  totalSentences: number;
  overallRecyclePct: number;
  verbRecyclePct: number;
  nounRecyclePct: number;
  adjRecyclePct: number;
};

const pct = (n: number, d: number): number => (d === 0 ? 0 : (100 * n) / d);

/** Every percentage shares the SAME denominator (total distinct sentences),
 *  not "sentences containing that class at all" — so overall/verb/noun/adj
 *  are directly comparable columns in one table row. */
export function summarize(stats: SentenceStat[]): RecycleSummary {
  const total = stats.length;
  const anyEarlier = stats.filter((s) => s.hasAnyEarlier).length;
  const verb = stats.filter((s) => s.hasEarlierVerb).length;
  const noun = stats.filter((s) => s.hasEarlierNoun).length;
  const adj = stats.filter((s) => s.hasEarlierAdjective).length;
  return {
    totalSentences: total,
    overallRecyclePct: pct(anyEarlier, total),
    verbRecyclePct: pct(verb, total),
    nounRecyclePct: pct(noun, total),
    adjRecyclePct: pct(adj, total),
  };
}

/**
 * "Same-frame" skeleton for near-duplicate detection: every content-word
 * token (verb/noun/adjective) is collapsed to its POS bucket; particles,
 * copula, and other function words are kept verbatim. Two sentences with
 * an identical skeleton are the same syntactic frame with different nouns/
 * verbs slotted in — exactly the "X-wa/ga Y-ni Z-wo あげる, three times"
 * class the 2026-09-09 rep-audit flagged as the real repetition driver.
 */
export function classSlotSkeleton(tokens: string[], classify: Classifier): string {
  return tokens
    .map((t) => {
      const meta = classify(t);
      return meta.pos === "other" ? t : `[${meta.pos}]`;
    })
    .join(" ");
}

/**
 * Grammar points whose id is a verified `te-<helper>` (or `chau`/`kite-chain`)
 * construction, scraped 2026-09-09 from every `grammarPointId` across
 * ir/m6..m38.ir.json. A plain substring/regex test on the id was tried first
 * and rejected: `-te-` as a substring false-positives on ids like
 * "ya-incomplete-list" (the token boundary is inside "complete-list", not a
 * real て-helper). An explicit allowlist has no such false positive and is
 * cheap to extend — recompile the grep in this file's test if a new te-*
 * grammar point ships and isn't in this set.
 */
export const ADDITIVE_GRAMMAR_IDS: ReadonlySet<string> = new Set([
  "chau",
  "kite-chain",
  "te-ageru",
  "te-form",
  "te-iku-kuru-space",
  "te-iru",
  "te-iru-resultative",
  "te-kara",
  "te-kudasai",
  "te-kureru",
  "te-kuru-iku-time",
  "te-miru",
  "te-mo-ii",
  "te-morau",
  "te-oku",
  "te-shimau",
  "te-wa-ikemasen",
]);

/** Fallback for lessons/modules whose grammarPointId isn't in the allowlist
 *  above (future modules, or a rule card that never got tagged) — scans the
 *  human-readable title text for the same construction spelled out in kana,
 *  or the English "te-form"/"te form" name. */
export const ADDITIVE_TITLE_RE =
  /て(みる|おく|ある|いる|しまう|いく|くる|あげる|くれる|もらう)|ちゃう|te[\s-]?form/i;

export function isAdditiveLesson(opts: {
  grammarPointIds: readonly string[];
  lessonTitle: string;
  moduleTitle: string;
}): boolean {
  if (opts.grammarPointIds.some((id) => ADDITIVE_GRAMMAR_IDS.has(id))) return true;
  if (ADDITIVE_TITLE_RE.test(opts.lessonTitle)) return true;
  if (ADDITIVE_TITLE_RE.test(opts.moduleTitle)) return true;
  return false;
}
