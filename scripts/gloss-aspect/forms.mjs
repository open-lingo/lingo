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
    houseEn: "\"X'd ahead of time\" — but leave the gloss BARE (no marker at all) when the sentence already has its own \"before Y\" clause, since that clause already carries the preparatory sense lexically",
    avoidEn: "bare \"X'd\" with NEITHER a before-clause NOR any preparatory marker; or stacking \"ahead of time\"/\"in advance\" onto a sentence that already has a before-clause",
    avoidWhy: "either drops the preparatory/for-later sense entirely, or pads a sentence that already carries it lexically via its own before-clause, which reads as redundant, over-literal English",
    // Softened 2026-09-18 (GLOSSFIX, lead spot-check on commit a35f9117):
    // this lane's first fix pass added "in advance, before Y" to every
    // て-oku sentence, including ones that already had a まえに/"before Y"
    // clause — that clause ALONE already signals the action is being done
    // ahead of the event, so stacking an explicit "in advance" marker on
    // top reads as clunky, over-literal American English. Two branches:
    judgeNote:
      "Before judging a gloss's wording here, check whether the ENGLISH gloss already has its own \"before Y\" clause (not just a まえに in the Japanese) — if so, a bare gloss with no other preparatory marker is CORRECT and should not be flagged, because \"before Y\" already carries the for-later sense. Only flag a genuinely bare gloss (no before-clause AND no preparatory marker) or a gloss that clumsily stacks \"in advance\"/\"ahead of time\" onto a sentence that already has a before-clause. When there is no before-clause and no marker at all, the house fix is \"X'd ahead of time\" (prefer this phrasing over \"in advance\" or \"went ahead and X'd\" — plainer, less stiff).",
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
    // Softened 2026-09-18 (GLOSSFIX, per lane GLOSS's 30-row hand audit —
    // see $S/briefs/GLOSS-report.md "Precision" section): the earlier
    // wording flagged
    // ANY bare past tense, which over-fired on verbs that are already
    // involuntary by their own English meaning (ねてしまった -> "fell
    // asleep on the train" — falling asleep is inherently not a choice, so
    // a plain past tense does not misinform about voluntariness). The
    // real defect class is a bare past tense of a verb that IS voluntary
    // by meaning, where dropping てしまう makes the English read as an
    // ordinary neutral choice (食べてしまった -> "I ate it" loses "I
    // [shouldn't have but] ate it all up").
    judgeNote:
      "Only flag when the verb is voluntary by its own lexical meaning (eat, lose something by carelessness, spend, forget on purpose-adjacent acts, break something by clumsiness) AND the bare-past gloss reads as an ordinary neutral choice, erasing the completion/regret nuance. Do NOT flag when the verb is already involuntary by its own English meaning (fall asleep, drop accidentally, catch a cold, cry) — a plain past tense of those verbs does not misread as a deliberate choice, so nothing is lost by omitting 'ended up' or 'went and'.",
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
    // Softened 2026-09-18 (GLOSSFIX, same audit): the earlier wording
    // over-fired on reporting/communication verbs in reported speech
    // (きしゃは じこが あったと いっていた -> "The reporter said there was
    // an accident.") — ordinary English "said" for a quoting ~ている does
    // not change what the sentence claims is true, so it is not a
    // progressive/resultative mismatch at all.
    judgeNote:
      "Only flag when swapping progressive for resultative (or vice versa) actually changes what the sentence claims is true right now (e.g. 'is putting on shoes' vs. the true reading 'is wearing shoes' — one says the action is mid-way, the other says it is already done and ongoing as a state). Do NOT flag an ordinary English past-tense rendering of a reporting/communication verb (e.g. plain 'said' for 言っていた in reported speech) — English does not need to mark that as 'was saying' to preserve the meaning, so there is no mismatch to flag.",
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
    houseEn: "\"I'm planning to X\" (default — plain, still marks intention-not-yet-acted-on, without sounding stiff) / \"intend to X\" (only where \"planning\" would itself misread)",
    avoidEn: "\"am going to X\"",
    avoidWhy: "collides with plain future, drops the intention-only frame",
    // Softened 2026-09-18 (GLOSSFIX, lead spot-check on commit a35f9117):
    // "I intend to X" is acceptable English and technically clears the
    // "am going to" collision, but reads stiff/formal for course-voice
    // prose; "I'm planning to X" is the plainer default that still clears
    // the same collision.
    judgeNote:
      "\"intend to X\" is not wrong, but prefer \"I'm planning to X\" as the default house wording — it is plainer and less stiff while still marking the intention-only, not-yet-acted-on sense. Do not flag an existing \"intend to X\" gloss as a mismatch on its own (it already clears the real defect, avoiding \"am/is/are going to X\"); this is a style preference for NEW glosses, not a fidelity rule to re-litigate old ones.",
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
