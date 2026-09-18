/**
 * SHARED-STEM CLOZE FACTORING (TestFlight #192, b28) — Spencer, m34's
 * そつぎょうすることになった / そつぎょうすることにした / そつぎょうした:
 * "just the word endings are preferred on things like this, look how long
 * they are, they all use sotsugyou anyways."
 *
 * A `particle-cloze` beat's `options` are meant to isolate the grammar point
 * under test; when every option is really the SAME word (or phrase) glued to
 * a different ending, printing the whole word on every tile buries the
 * contrast the learner is supposed to read (and pads every option to 2-3x
 * its useful length). Fold the shared word into the sentence `stem` and keep
 * only the endings as options — same answer, same explanation, just less to
 * read per option.
 *
 * Called from `compile-ir.mjs` on the parsed IR document, before it's
 * written to `mN.ir.json` — this is a compile-time transform, not a runtime
 * one; `moduleCompiler.ts`'s `cloze()` factory needs no changes at all, it
 * just reads the already-folded stem/options straight off the compiled JSON.
 *
 * SAFETY (never split inside a word): the rule folds ONLY the
 * "NOUN + する-conjugation" pattern (Spencer's example: そつぎょう + する/
 * することになった/することにした/した), never a verb's or adjective's own
 * inflection. THREE independent conditions are required together, because
 * each alone produced a real false positive on a course-wide dry run:
 *
 *   1. Prefix carries a JMdict `vs` (suru-noun) tag. Alone this is NOT
 *      enough: `lookupKana` merges POS tags across every homograph of a
 *      kana spelling, and common short strings like さが/がんば/あそ/いき/
 *      こと/かし/はじ each have a dozen unrelated entries, one of which
 *      happens to carry `vs` by coincidence, while the actual word being
 *      conjugated (探す/頑張る/遊ぶ/行く/事/貸す/始まる) is a completely
 *      unrelated godan verb or noun+particle. `vs`-tagged alone folded
 *      さがそう/さがすつもりだ/さがす (探す, one VERB in three
 *      conjugations) into "さが" + endings.
 *   2. Every trimmed remainder starts with する or し (します/した/して/
 *      しよう/しない/…) — textual shape of a する-conjugation. Alone this
 *      is ALSO not enough: godan verbs ending in す (無くす→無くして,
 *      探す→探して) conjugate to an IDENTICAL su/shi-initial surface by
 *      pure phonological coincidence with する's own paradigm, and some
 *      い-adjectives (美味しい, 面白い) contain an internal し that lines up
 *      the same way (おい+しくない, おも+しろい). Condition 1 alone would
 *      have let those two categories through if their prefix's kana ALSO
 *      happened to hit a stray `vs` tag; condition 2 alone let them through
 *      on a dry run of THIS rule (おいしい/面白い/なくして all passed a bare
 *      "starts with し" check).
 *   3. The prefix is at least 2 kana — a single mora is almost always
 *      accidental.
 *
 * Combined, every known false positive (さが/がんば/あそ/いき/こと/かし/
 * はじ/おい/なく/おも, discovered across two dry runs of the whole JA
 * course) is rejected, and the real そつぎょう case (and the same-shape
 * べんきょう/そうじ/さんぽ/れんしゅう/けっこん class) passes. Scope note:
 * this only folds the NOUN+する pattern; other prefix-sharing shapes (if
 * any exist course-wide) are deliberately left unfolded rather than
 * guessed at.
 */
import { lookupKana, jmdictAvailable } from "../qa/procedural/lib/jmdict.mjs";

const SURU_POS = new Set(["vs", "vs-i", "vs-s", "vs-c"]);
const MIN_PREFIX_LEN = 2;
const SURU_CONTINUATION_RE = /^(する|し)/;

function longestCommonPrefixLen(strs) {
  let len = strs[0].length;
  for (const s of strs.slice(1)) {
    let i = 0;
    while (i < len && i < s.length && strs[0][i] === s[i]) i++;
    len = i;
    if (len === 0) break;
  }
  return len;
}

function isSuruNoun(text, lookup) {
  const hit = lookup(text);
  if (!hit) return false;
  return hit.common && hit.pos.some((p) => SURU_POS.has(p));
}

/**
 * The shared-prefix candidate for one cloze's `options`, or `null` if no
 * safe split exists. Exported directly for focused unit tests; `lookup`
 * defaults to the real JMdict `lookupKana` but is injectable so tests don't
 * need the 19 MB sidecar index on disk.
 */
export function findSharedStemSplit(options, lookup = lookupKana) {
  const lcp = longestCommonPrefixLen(options);
  for (let len = Math.min(lcp, options[0].length - 1); len >= MIN_PREFIX_LEN; len--) {
    const prefix = options[0].slice(0, len);
    const remainders = options.map((o) => o.slice(len));
    // Never fully consume an option — every trimmed option must stay
    // non-empty, or the "ending" is nothing at all.
    if (remainders.some((r) => r.length === 0)) continue;
    if (!remainders.every((r) => SURU_CONTINUATION_RE.test(r))) continue;
    if (!isSuruNoun(prefix, lookup)) continue;
    return prefix;
  }
  return null;
}

/**
 * Walk every `particle-cloze` beat in a parsed IR document and fold a shared
 * NOUN+する prefix into the stem in place. Returns the list of changes made
 * (for the compiler's own log line); mutates `doc` directly, matching the
 * rest of `compile-ir.mjs`'s style (`ir.priorVocab = …`, etc.).
 *
 * `lookup` is injectable for tests; defaults to the real JMdict-backed
 * `lookupKana`. When JMdict isn't installed (`jmdictAvailable()` false) this
 * is a no-op — strictly additive to the existing authored shape, never a
 * hard failure.
 */
export function splitSharedClozeStem(doc, lookup = lookupKana) {
  const changes = [];
  if (lookup === lookupKana && !jmdictAvailable()) return changes;

  for (const lesson of doc.lessons ?? []) {
    for (const beat of lesson.beats ?? []) {
      if (beat.kind !== "particle-cloze") continue;
      if (!Array.isArray(beat.options) || beat.options.length < 2) continue;
      // Distinct options only — a duplicate would trivially share the whole
      // string as its own "prefix" and isn't this pattern.
      if (new Set(beat.options).size !== beat.options.length) continue;
      const prefix = findSharedStemSplit(beat.options, lookup);
      if (!prefix) continue;
      const before = { stem: beat.stem, options: [...beat.options], answer: beat.answer };
      beat.stem = `${beat.stem}${prefix}`;
      beat.options = beat.options.map((o) => o.slice(prefix.length));
      beat.answer = beat.answer.slice(prefix.length);
      changes.push({
        lessonId: lesson.id,
        prefix,
        before,
        after: { stem: beat.stem, options: beat.options, answer: beat.answer },
      });
    }
  }
  return changes;
}
