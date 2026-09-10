/**
 * FR speech grading of the negation-frame fillers («jamais», «rien», «plus»)
 * — verification for `docs/fr-m18-brief-2026-09-10.md`'s Unverified Claim #1
 * (2026-09-10).
 *
 * Background: the m18 brief («Jamais, rien, plus») generalizes the m13
 * «ne…pas» frame to three new fillers and flags, as an explicit blocker on
 * how the module may be authored, that the general fuzzy speech matcher
 * (`scoreAlternativesGeneric` in `src/shared/speech/loose-match.ts`, the same
 * scorer `frSpeechElision.test.ts` verified for elision) has never been
 * traced against `jamais`/`rien`/`plus`. This file is that trace, done
 * against the REAL scorer (every number below was measured, not asserted —
 * see the `Math.round(...*1000)/1000` scores in comments, reproduced from a
 * throwaway probe run against this exact code).
 *
 * Sentence strings below (e.g. "il n'est jamais content", "il n'a rien dit",
 * "je n'ai plus faim") are drawn illustratively from the brief's own §2/§4
 * lesson sketches for SHAPE coverage (simple present + passé composé, both
 * auxiliaries). This file does not vet them against the vocab-provenance
 * gate or commit to final m18 wording/atom scope — that is the content
 * author's job once dispatched; this file only asks "if a sentence roughly
 * this shape existed as a `speaking` target, does the grader behave safely."
 *
 * FINDINGS SUMMARY (full detail: `docs/fr-speech-negation-2026-09-10.md`):
 *
 * 1. Colloquial ne-dropping («je mange jamais», «j'mange plus», «il a rien
 *    dit») generalizes cleanly from `pas` to all three new fillers — every
 *    variant tested passes "perfect" or "close". No fix needed; this is the
 *    SAME lenient behavior `frSpeechElision.test.ts` already verified and
 *    deliberately did not patch for `pas`. See "accepted hearings" below.
 *
 * 2. Three NEW, genuine near-miss risks this bag-of-characters +
 *    substring-coverage scorer does not catch, none of them French-specific
 *    and none fixable by a small, targeted change (unlike the elision file's
 *    apostrophe-fold, which only added an equivalence and could never turn a
 *    pass into a fail — a floor/threshold or edit-distance change here would
 *    move scores for EVERY language and every existing target, which is
 *    exactly the "Future replacement: swap in a Whisper-based phoneme-aware
 *    compare" the file's own header already defers). Documented as measured
 *    CURRENT behavior below, and as authoring constraints in the sibling
 *    doc — not patched, per the same judgment call
 *    `frSpeechElision.test.ts` already made for de-elision.
 *    - «rien» / «bien» ("nothing" / "well") — a one-character swap in a
 *      longer sentence: "je ne mange rien" vs "je ne mange bien" scores
 *      0.923 ("perfect"); the bare words alone ("rien" vs "bien") score
 *      0.75 ("close", still a pass).
 *    - «jamais» / «mais» ("never" / "but") — "mais" is a literal, 4-of-6
 *      character CONTIGUOUS substring of "jamais" (`substringScore`'s
 *      partial-coverage floor is 0.6; "mais" covers 0.667 of "jamais"), so
 *      an isolated "jamais" target graded against a "mais" transcript scores
 *      1.0 ("perfect") via the substring path, not char-overlap. Embedding
 *      in a full sentence lowers but does not remove the risk (0.857,
 *      still "perfect").
 *    - «jamais» / «rien» cross-substitution — the module's own L3/L6
 *      discrimination-drill pair — is inconsistent: "je n'ai rien" vs
 *      "je n'ai jamais" correctly fails (0.545, just under the 0.55 "close"
 *      floor), but "je ne sais jamais" vs "je ne sais rien" scores 0.643
 *      ("close", a pass) in the SAME sentence frame the brief's own L1
 *      bridge card uses. Sentence-shape-dependent, not filler-dependent.
 *
 * 3. The `encore` (m6, "more/another") vs `plus` (m18, "no more") collision
 *    the brief already flagged as comprehension-only (§5) is ALSO a grading
 *    collision, newly measured here: "il n'habite plus à Paris" (he no
 *    longer lives there) vs "il habite encore à Paris" (he STILL lives
 *    there — the opposite claim) scores 0.75 ("close", a pass). Compounding
 *    ne-drop with the encore swap ("je fume encore" for "je ne fume plus")
 *    still scores 0.667 ("close", a pass). Dropping the negation marker
 *    ENTIRELY with no substitute filler ("il habite à Paris" for
 *    "il n'habite plus à Paris" — a plain, unmarked affirmative) scores
 *    0.737 ("close", a pass).
 *
 * 4. `plus`'s silent-final-s pronunciation ([ply] negative vs [plys]/[plyz]
 *    comparative/additive, brief §5/§6) is a STRUCTURAL blind spot, not an
 *    unverified one: this scorer (and every ASR engine feeding it — Web
 *    Speech API, Whisper, native SFSpeechRecognizer per
 *    `frSpeechElision.test.ts`'s header) compares TEXT transcripts. The
 *    transcript for "plus" is the same string whether the speaker produced
 *    [ply] or [plys] — speech-to-text does not preserve that phonetic
 *    detail in its output, so no text-comparison scorer, however tuned,
 *    could ever verify the silent -s from the transcript alone. This is not
 *    a gap to trace further; it's a hard ceiling on what a `speaking` step
 *    on `ne…plus` can confirm (see doc for the constraint this implies).
 *
 * None of 2–4 regress anything `frSpeechElision.test.ts` covers (that suite
 * stays green, unchanged, run in the same gate below) — this file adds
 * coverage, it does not touch `loose-match.ts`.
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";

/** Grade an ASR transcript against `target` the exact way `SpeakingStepView`
 *  does for every non-JA course (fr included). Mirrors `frSpeechElision.test.ts`. */
function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

/** A transcript "passes" a speaking step when verdict is perfect OR close —
 *  see `SpeakingStepView.tsx`: `passed = verdict === "perfect" || "close"`. */
function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

/**
 * Representative m18-shaped sentences covering all three fillers across
 * simple present and passé composé (both auxiliaries), per the brief's
 * §2/§4 lesson sketches. Illustrative for matcher coverage only (see file
 * header) — `via` names which brief section the shape comes from.
 */
const NEGATION_TARGETS: Array<{ target: string; via: string }> = [
  { target: "je ne sais jamais", via: "brief §2.1 / §4 L1 bridge sentence" },
  { target: "je ne suis jamais en retard", via: "brief §4 L1 cast consolidation" },
  { target: "il n'est jamais content", via: "brief §4 L2 (adjective placeholder)" },
  { target: "je n'ai rien", via: "brief §4 L4 debut" },
  { target: "je ne mange rien", via: "brief §4 L4 debut" },
  { target: "elle ne comprend rien", via: "brief §4 L5, contrasts m2 «je ne comprends pas»" },
  { target: "je ne fume plus", via: "brief §4 L7 debut" },
  { target: "il n'habite plus à Paris", via: "brief §4 L7 debut" },
  { target: "je n'ai jamais mangé", via: "brief §2.3 / §4 L9, avoir" },
  { target: "elle n'est jamais allée", via: "brief §2.3 / §4 L9, être" },
  { target: "il n'a rien dit", via: "brief §2.3 L9 (flagged likely-cut, dire)" },
  { target: "je n'ai plus faim", via: "brief §2.3 L9 (flagged likely-cut, faim)" },
];

/**
 * Strip the negation marker the colloquial way: drop a standalone "ne " and
 * any elided "n'"/"n'" prefix, leaving the filler (jamais/rien/plus) as the
 * only overt negative — exactly how casual spoken French drops «ne» while
 * keeping the sentence unambiguously negative for `pas`, and (per the
 * measurements above) `jamais`/`rien` behave the same way. `plus` is
 * included for completeness, but see the file header (§1 vs §3) — dropping
 * «ne» before `plus` is the one case where the resulting sentence is
 * genuinely text-ambiguous with the untaught affirmative sense, not just a
 * pronunciation variant; that risk is documented, not something this
 * function needs to special-case (the grading outcome is what's tested).
 */
function neDrop(s: string): string {
  return s.replace(/\bne\s+/gi, "").replace(/\bn['’]/gi, "").trim();
}

describe("FR speech negation grading — jamais/rien/plus (2026-09-10)", () => {
  describe("baseline: authored transcript is always exact", () => {
    it.each(NEGATION_TARGETS)("$target", ({ target }) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("accepted hearings: colloquial ne-drop generalizes from «pas» to jamais/rien/plus", () => {
    // The module's whole teaching claim (brief §2) is that jamais/rien/plus
    // fill the same slot pas already fills — so they should inherit the
    // SAME grading leniency pas already has (verified in
    // frSpeechElision.test.ts's de-elision block). Measured: every sentence
    // below passes "perfect" or "close" with «ne» dropped, matching that
    // precedent — no code change needed.
    it.each(NEGATION_TARGETS)("$target → ne-dropped", ({ target }) => {
      const dropped = neDrop(target);
      if (dropped === target) return; // no "ne"/"n'" in this sentence
      const r = grade(target, dropped);
      expect(passed(r.verdict)).toBe(true);
    });
  });

  describe("accepted hearings: explicit forms named in the m18 brief / task", () => {
    it('«je ne mange jamais» — ne-dropped "je mange jamais" passes', () => {
      const r = grade("je ne mange jamais", "je mange jamais");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je ne vois rien» — ne-dropped "je vois rien" passes', () => {
      const r = grade("je ne vois rien", "je vois rien");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je ne mange plus» — ne-dropped "je mange plus" passes (score 0.846, "close")', () => {
      const r = grade("je ne mange plus", "je mange plus");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je ne mange plus» — contracted colloquial "j\'mange plus" passes', () => {
      const r = grade("je ne mange plus", "j'mange plus");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je ne mange plus» — contracted, apostrophe-dropped "jmange plus" passes', () => {
      const r = grade("je ne mange plus", "jmange plus");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je n\'ai rien» — physically de-elided "je ne ai rien" passes (perfect, 0.9)', () => {
      const r = grade("je n'ai rien", "je ne ai rien");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«je n\'ai rien» — curly apostrophe is an exact fold (already fixed for elision, generalizes for free)', () => {
      const r = grade("je n'ai rien", "je n’ai rien");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("true negatives: unrelated sentences and clean antonyms correctly fail (sanity check)", () => {
    // Proves the scorer isn't hopelessly lenient — a genuinely wrong answer
    // still lands in try-again for these cases.
    const cases: Array<[string, string]> = [
      ["jamais", "toujours"], // never / always
      ["rien", "tout"], // nothing / everything
      ["je ne fume plus", "j'aime le chocolat"], // unrelated sentence
      ["je ne sais jamais", "je ne comprends pas"], // unrelated (different verb + filler)
    ];
    it.each(cases)("target=%s transcript=%s → try-again", (target, transcript) => {
      const r = grade(target, transcript);
      expect(r.verdict).toBe("try-again");
    });
  });

  describe("NOT PATCHED — documented near-miss false positives (constraints, not bugs)", () => {
    // Every score below was measured against the real scorer. Each is a
    // structural limitation of bag-of-characters + substring-coverage
    // scoring (see file header §2) — fixing any of them would mean either
    // raising PARTIAL_COVERAGE_FLOOR (moves every language's substring
    // tier) or adding edit-distance/phonetic awareness (the file's own
    // deferred "Future replacement"), neither of which is the kind of
    // small, targeted, can-only-turn-a-fail-into-a-pass change the
    // apostrophe fold (35e5acdb) was. Left as-is; surfaced as authoring
    // constraints in docs/fr-speech-negation-2026-09-10.md instead.

    it('«rien» vs «bien» ("nothing" vs "well") in a full sentence scores PERFECT — false positive', () => {
      const r = grade("je ne mange rien", "je ne mange bien");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.923, 2);
    });

    it('«rien» vs «bien» as bare words scores CLOSE (still a pass) — false positive', () => {
      const r = grade("rien", "bien");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBe(0.75);
    });

    it('«jamais» vs «mais» ("never" vs "but") as a bare word scores PERFECT via substring coverage — false positive', () => {
      // "mais" is a contiguous substring of "jamais" covering 4/6 = 0.667,
      // above substringScore's PARTIAL_COVERAGE_FLOOR (0.6) — this is the
      // substring path, not char-overlap, scoring 1.0 outright.
      const r = grade("jamais", "mais");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«jamais» vs «mais» embedded in a full sentence still scores PERFECT — false positive persists', () => {
      const r = grade("je ne sais jamais", "je ne sais mais");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.857, 2);
    });

    it('«jamais» vs «rien» cross-substitution in the L1 bridge sentence shape scores CLOSE — false positive on the module\'s own discrimination pair', () => {
      const r = grade("je ne sais jamais", "je ne sais rien");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.643, 2);
    });

    it('«jamais» vs «rien» cross-substitution in a shorter sentence correctly fails — the same swap is NOT uniformly unsafe, just sentence-shape-dependent', () => {
      const r = grade("je n'ai rien", "je n'ai jamais");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.545, 2);
    });

    it('«encore» (still/more) vs the new negative «plus» (no longer) — near-OPPOSITE meaning, scores CLOSE', () => {
      const r = grade("il n'habite plus à paris", "il habite encore à paris");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.75, 2);
    });

    it('«encore» swap compounded with a dropped «ne» still scores CLOSE', () => {
      const r = grade("je ne fume plus", "je fume encore");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.667, 2);
    });

    it('negation marker dropped ENTIRELY (no filler substituted) — plain unmarked affirmative still scores CLOSE', () => {
      // "il habite à Paris" (he lives in Paris) vs the target "il n'habite
      // plus à Paris" (he no longer lives in Paris) — not even a ne-drop
      // *plus filler*, just the whole negation gone. Still a pass.
      const r = grade("il n'habite plus à paris", "il habite à paris");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.737, 2);
    });
  });

  describe("structural note: «plus» pronunciation is invisible to a text-based scorer", () => {
    it("identical transcript text scores identically regardless of what phonetic realization produced it", () => {
      // There is no way to construct a test that tells [ply] from [plys]
      // here — that IS the finding. The scorer (and every upstream ASR
      // engine) only ever sees text. A transcript "je ne mange plus" scores
      // the same whether the learner said the correct silent-s [ply] or the
      // incorrect voiced [plys]/[plyz], because speech-to-text collapses
      // that distinction before this function ever runs.
      const correctPronunciationTranscript = "je ne mange plus"; // hypothetical [ply]
      const wrongPronunciationTranscript = "je ne mange plus"; // hypothetical [plys]
      const a = grade("je ne mange plus", correctPronunciationTranscript);
      const b = grade("je ne mange plus", wrongPronunciationTranscript);
      expect(a.bestScore).toBe(b.bestScore);
      expect(a.verdict).toBe(b.verdict);
    });
  });
});
