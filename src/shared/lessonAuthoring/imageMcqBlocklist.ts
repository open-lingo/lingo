/**
 * Generic image-MCQ blocklist helpers.
 *
 * Each language module owns its own blocklist (a set of atom surfaces /
 * kana / morpheme spellings for which a visual MCQ would mislead). The
 * generic helper here just filters a pool against an arbitrary
 * blocklist — the language module supplies the set.
 *
 * Phase 2 will expose this on the `LanguageModule.imageMcqBlocklist`
 * slot. Today the JA wrapper inside `_jaGrammarHelpers.ts` pre-binds
 * the JA list.
 */

/** Item-shape requirement: anything filtered must expose a `kana` surface. */
export interface BlocklistableAtom {
  kana: string;
}

/** Returns a copy of `pool` with blocklisted atoms removed. */
export function withoutMcqBlocked<T extends BlocklistableAtom>(
  blocklist: ReadonlySet<string>,
  pool: readonly T[],
): T[] {
  return pool.filter((a) => !blocklist.has(a.kana));
}
