#!/usr/bin/env node
/**
 * Gloss-aspect fidelity — the house-gloss table as data.
 *
 * Mirrors docs/lesson-authoring-guide.md §7b (the source of truth for
 * authors — keep both in sync by hand; this file is what the tooling reads).
 *
 * Each entry:
 *   id        — stable slug
 *   label     — the JA form(s), for display
 *   asserts   — what the form asserts about the event (plain English)
 *   houseEn   — the decided house gloss pattern
 *   avoidEn   — the English wording to avoid, and why
 *   avoidWhy  — why the avoid wording misleads
 *   jaTest    — RegExp tested against the JA sentence to detect the form
 *   avoidTest — RegExp tested against the EN gloss for a MECHANICAL,
 *               best-effort signal that the gloss used the avoid wording;
 *               null where no reliable lexical marker exists (the form's
 *               avoid case needs semantic judgment — the local judge, not
 *               a regex, per project doctrine "mechanical gates cannot
 *               judge language", docs/content-change skill §9). A row with
 *               avoidTest === null is never claimed "clean" by count alone.
 */

export const FORMS = [
  {
    id: "you-to-suru",
    label: "ようとした / ようとする",
    asserts:
      "attempt made; outcome NOT asserted (often implies it didn't land)",
    houseEn: "\"was going to X\" / \"went to X\" (attempt)",
    avoidEn: "\"tried to X\"",
    avoidWhy:
      "reads as ordinary success-neutral \"tried\", collides with てみた",
    // The volitional always ends in an お-row kana + う (ru-verbs/irregulars
    // take よう; u-verbs take their own row's お-column + う — のむ->のもう,
    // いく->いこう, かう->かおう, etc.), so ようとし(た/する) alone MISSES
    // every u-verb instance, including the real TestFlight #200/#201 row
    // itself (あつい コーヒーを のもうとした。). Match any お-row kana + う
    // immediately before と(し|す).
    jaTest: /[おこごそとどのほぼぽもよろ]う(?:と(?:し|す))/,
    avoidTest: /\btried to\b/i,
  },
  {
    id: "te-miru",
    label: "てみた / てみる",
    asserts: "did X experimentally; the event happened",
    houseEn: "\"tried X-ing\" / \"gave X a try\"",
    avoidEn: "\"was going to X\"",
    avoidWhy: "erases that the event occurred",
    jaTest: /てみ[たる]|でみ[たる]/,
    avoidTest: /\bwas going to\b/i,
  },
  {
    id: "te-oku",
    label: "ておく",
    asserts: "did X in advance, for later",
    houseEn: "\"went ahead and X'd\" / \"X'd (for later)\"",
    avoidEn: "bare \"X'd\" with no for-later sense",
    avoidWhy: "drops the preparatory/for-later sense",
    jaTest: /てお[くいた]|でお[くいた]|とい[たて]\b/,
    avoidTest: null,
  },
  {
    id: "te-shimau",
    label: "てしまう / ちゃう",
    asserts: "completion, often with regret / no-going-back",
    houseEn: "\"ended up X'ing\" / \"went and X'd\"",
    avoidEn: "bare \"X'd\"",
    avoidWhy: "drops completion + affect",
    jaTest: /てしま|でしま|ちゃ[ういた]|じゃ[ういた]/,
    avoidTest: null,
  },
  {
    id: "te-iru",
    label: "ている (progressive vs. resultative)",
    asserts: "ongoing action (progressive) OR a resulting state (resultative), depending on verb class",
    houseEn: "\"is X-ing\" (progressive) / \"has X on\", \"is wearing\" (resultative)",
    avoidEn: "the wrong one of the two",
    avoidWhy: "progressive/resultative mismatch changes what the sentence claims is true right now",
    jaTest: /てい[るた]|でい[るた]/,
    avoidTest: null,
  },
  {
    id: "ta-koto-ga-aru",
    label: "たことがある",
    asserts: "experience, ever (at least once)",
    houseEn: "\"have X'd before\"",
    avoidEn: "bare \"X'd\"",
    avoidWhy: "drops the experiential frame",
    jaTest: /たことが ?ある|だことが ?ある/,
    avoidTest: /\bbefore\b/i, // inverted below: avoid = MISSING "before"
    avoidIsInverted: true,
  },
  {
    id: "tsumori",
    label: "つもり",
    asserts: "intention, not yet acted on",
    houseEn: "\"intend to X\" / \"plan to X\"",
    avoidEn: "\"am going to X\"",
    avoidWhy: "collides with plain future, drops the intention-only frame",
    jaTest: /つもり/,
    avoidTest: /\bam going to\b|\bis going to\b|\bare going to\b/i,
  },
  {
    id: "hazu",
    label: "はず",
    asserts: "expectation from evidence, not certainty",
    houseEn: "\"should be X\" / \"is supposed to be X\"",
    avoidEn: "flat \"is X\"",
    avoidWhy: "overstates certainty the ja does not assert",
    // negative lookahead excludes はずかしい/はずかしがる ("embarrassed") —
    // an unrelated i-adjective that happens to contain はず as a substring
    // (found by the extraction sanity pass, 2026-09-18).
    jaTest: /はず(?!かし)/,
    avoidTest: null,
  },
  {
    // The course teaches TWO distinct senses under this one particle
    // (found in the extraction sanity pass, 2026-09-18: both are common,
    // roughly evenly split, and both are currently glossed correctly): (a)
    // verb-TA-form + ばかり = "just did X" (recency); (b) noun + ばかり =
    // "nothing but N / all N" (exclusivity) — a DIFFERENT construction that
    // does not need "just" at all. A mechanical "missing the word just"
    // check therefore false-positives on every exclusivity-sense sentence;
    // judge this one by reading the ja's actual shape, not by string match.
    id: "bakari",
    label: "ばかり (recency: V-たばかり / exclusivity: N ばかり)",
    asserts:
      "recency (verb-ta + ばかり, 'just finished') OR exclusivity (noun + ばかり, 'nothing but/all N') — different constructions, same particle",
    houseEn: "\"just X'd\" (recency) / \"all (I) do is X\", \"nothing but X\" (exclusivity)",
    avoidEn: "bare \"X'd\" for the recency sense",
    avoidWhy: "drops the recency (exclusivity-sense sentences do not need \"just\" — do not flag those)",
    jaTest: /ばかり/,
    avoidTest: null, // two senses -> no reliable single mechanical marker
  },
  {
    id: "you-ni-naru",
    label: "ようになる",
    asserts: "change of state/ability over time",
    houseEn: "\"came to X\" / \"got so that X\"",
    avoidEn: "flat \"X's\"",
    avoidWhy: "drops the change-over-time",
    jaTest: /ようにな[るっ]/,
    avoidTest: null,
  },
  {
    id: "koto-ni-suru",
    label: "ことにする",
    asserts: "decided BY ME",
    houseEn: "\"I decided to X\"",
    avoidEn: "\"it was decided that X\"",
    avoidWhy: "wrong decider — flips agency to nobody",
    jaTest: /ことにし|ことにする/,
    avoidTest: /\bit was decided\b/i,
  },
  {
    id: "koto-ni-naru",
    label: "ことになる",
    asserts: "decided/settled, decider left unnamed",
    houseEn: "\"it's been decided/settled that X\"",
    avoidEn: "\"I decided to X\"",
    avoidWhy: "wrong decider — invents an agent the ja deliberately omits",
    jaTest: /ことになっ|ことになる/,
    avoidTest: /\bI decided\b/i,
  },
  {
    id: "kake",
    label: "かけ",
    asserts: "started, interrupted / unfinished",
    houseEn: "\"half-X'd\" / \"started X-ing (and stopped)\"",
    avoidEn: "bare \"X'd\"",
    avoidWhy: "drops the incompleteness",
    jaTest: /かけ(?:の|だ|て|た)/,
    avoidTest: null,
  },
  {
    id: "souda",
    label: "そうだ (looks-like vs. hearsay)",
    asserts: "visual inference (looks-like) OR reported speech (hearsay) — same string, different conjugation base",
    houseEn: "\"looks like X\" (looks-like) / \"I heard X\", \"apparently X\" (hearsay)",
    avoidEn: "the wrong one of the two",
    avoidWhy: "wrong evidential source — the course must not gloss hearsay as a visual guess or vice versa",
    // The evidential そう attaches directly to a verb/adjective STEM with no
    // gap (ふり+そうだ, おいし+そうだ, く る+そうだ). A confirmatory そう
    // ("that's right") is a standalone pro-form, always preceded by
    // sentence-start or punctuation/space (はい、そうです / うん、そうだね),
    // never by a stem character — require a preceding kana/kanji character
    // to exclude the confirmatory reading (found by the extraction sanity
    // pass, 2026-09-18: ~5 of the original matches were "そうです"/"そうだね"
    // confirmations, not the grammar point).
    jaTest: /(?<=[぀-ヿ一-鿿])そう(?:だ|です|な)/,
    avoidTest: null,
  },
  {
    id: "tagaru",
    label: "たがる",
    asserts: "third-party desire, as OBSERVED from outside",
    houseEn: "\"X seems to want to Y\"",
    avoidEn: "\"X wants to Y\"",
    avoidWhy: "drops the observed-from-outside frame (たい is 1st-person-only; たがる is how you say it about someone else)",
    jaTest: /たがっ|たがる/,
    avoidTest: /\bwants to\b|\bwant to\b/i,
  },
];

export function detectForms(ja) {
  if (typeof ja !== "string" || ja.length === 0) return [];
  return FORMS.filter((f) => f.jaTest.test(ja)).map((f) => f.id);
}

export function getForm(id) {
  return FORMS.find((f) => f.id === id) ?? null;
}

/** Best-effort mechanical "does this gloss look like it used the avoid
 * wording" signal. Returns null (not "no") when the form has no reliable
 * lexical marker — a null must never be counted as "clean". */
export function looksLikeAvoid(formId, en) {
  const f = getForm(formId);
  if (!f || !f.avoidTest || typeof en !== "string") return null;
  const hit = f.avoidTest.test(en);
  return f.avoidIsInverted ? !hit : hit;
}
