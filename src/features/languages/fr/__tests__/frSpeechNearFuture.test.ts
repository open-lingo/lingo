/**
 * FR speech grading of the near-future frame («aller + infinitif») —
 * verification for `docs/fr-m19-brief-2026-09-10.md`'s §6 unverified claim
 * (2026-09-10).
 *
 * Background: the m19 brief («Je vais parler») generalizes m5's fixed
 * motion-sense phrase atoms `je vais`/`tu vas`/`on va` (plus new `il va`/
 * `elle va`) to front a bare infinitive instead of a destination. §6 flags,
 * honestly, that — unlike m17's numbers (`ROMANCE_NUMBER_WORDS` traced) and
 * m18's negators (`frSpeechNegation.test.ts`) — nobody has run the general
 * fuzzy speech matcher (`scoreAlternativesGeneric` in
 * `src/shared/speech/loose-match.ts`, the same scorer `frSpeechElision.test.ts`
 * and `frSpeechNegation.test.ts` verified) against sentences like "je vais
 * parler" / "il va manger." This file is that trace, mirroring both
 * precedents' method exactly — every score below was measured against the
 * REAL scorer (`Math.round(...*1000)/1000`, reproduced from a throwaway
 * probe run against this exact code), not asserted.
 *
 * FINDINGS SUMMARY (full detail: `docs/fr-speech-near-future-2026-09-10.md`):
 *
 * 1. Colloquial subject-chunk reductions generalize cleanly: contracted
 *    "j'vais parler" (0.917, perfect), s-dropped "tu va manger" (0.909,
 *    perfect), and the whole -er/-é/-ez homophone group (French speakers —
 *    and therefore ASR engines and even a learner reading a phonetic
 *    respelling — cannot distinguish "parler"/"parlé"/"parlez" by ear; "on
 *    va visité Paris", "tu vas mangez", "je vais parlez" all measured
 *    perfect or close) all pass. No fix needed — same class of leniency
 *    `frSpeechElision.test.ts` verified for the "pas"-generation chunks.
 *
 * 2. Infinitive-vs-participle homophony ("parler"/"parlé", identical sound,
 *    [e] either way) does NOT get rejected, as required — "je vais parlé"
 *    for target "je vais parler" scores 0.833 (close); even the bare-word
 *    pair "parler"/"parlé" scores 0.667 (close, the lowest measured
 *    passing score in this file, but still over the 0.55 floor). This is
 *    the SAME judgment call `frSpeechElision.test.ts` made for de-elision —
 *    a pronunciation-identical variant must pass, and it does, with no
 *    code change.
 *
 * 3. Four measured false-positive near-misses, none fixed (each needs
 *    raising `PARTIAL_COVERAGE_FLOOR` or edit-distance/phonetic scoring —
 *    matcher-wide, not a targeted fold like the elision file's apostrophe
 *    fix — exactly the judgment call `frSpeechNegation.test.ts` already
 *    made for jamais/rien/plus):
 *    - **je vais / je vois** ("I'm going" / "I see") — bare words score
 *      0.833 (close); embedded in a full sentence ("je vois parler" for
 *      "je vais parler") the one-character swap dilutes further and scores
 *      0.917 (perfect).
 *    - **il va / il y a** ("he's going" / "there is") — bare words score
 *      0.75 (close); embedded ("il y a habiter ici" for "il va habiter
 *      ici") scores 0.929 (perfect) — sentence embedding makes this WORSE,
 *      not better, same direction as the m18 finding.
 *    - **il va / il a**, **on va / on a** ("he's going/he has",
 *      "we're going/we have" — the aller/avoir minimal pair) — bare words
 *      both score 0.75 (close); "on a manger" for "on va manger" scores
 *      0.9 (perfect).
 *    - **elle va / il va** (gender swap) is sentence-shape-dependent, the
 *      SAME inconsistency class `frSpeechNegation.test.ts` found for
 *      jamais/rien: the bare 2-word phrase correctly fails ("il va" vs
 *      "elle va" scores 0.5, try-again), but embedded in a sentence
 *      ("il va parler" for "elle va parler") it scores 0.75 (close, a
 *      pass) — the gender distinction survives at the phrase level but not
 *      once diluted into a longer sentence.
 *
 * 4. One compounded-degradation risk, documented not patched: stacking
 *    THREE simultaneous colloquial reductions on the same target — the
 *    contraction (je→j'), the phonetic respelling of vais (→vé), AND the
 *    participle-homophone respelling of parler (→parlé) — drops "je vais
 *    parler" heard as "j'vé parlé" to 0.5 (try-again), just under the 0.55
 *    close floor, even though each reduction ALONE passes (finding #1/#2
 *    above). This is an inherent property of bag-of-characters scoring
 *    losing ground with every simultaneous edit, not a French-specific bug;
 *    fixing it generically would move every language's threshold. Recorded
 *    as an authoring constraint, not a defect.
 *
 * None of 1–4 regress `frSpeechElision.test.ts` or `frSpeechNegation.test.ts`
 * (both stay green, unchanged, run in the same gate below) — this file adds
 * coverage, it does not touch `loose-match.ts`.
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";

/** Grade an ASR transcript against `target` the exact way `SpeakingStepView`
 *  does for every non-JA course (fr included). Mirrors `frSpeechElision.test.ts`
 *  and `frSpeechNegation.test.ts`. */
function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

/** A transcript "passes" a speaking step when verdict is perfect OR close —
 *  see `SpeakingStepView.tsx`: `passed = verdict === "perfect" || "close"`. */
function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

/**
 * Representative m19-shaped sentences: the five subject chunks (`je vais`
 * m5, `tu vas` m5, `on va` m5, `il va` m19 §3, `elle va` m19 §3) each
 * fronting one of the four already-taught bare infinitives (`parler`/
 * `habiter` m11, `manger` m14, `visiter` m15), per the brief's §2/§4 lesson
 * sketches. Illustrative for matcher coverage only (see file header) — `via`
 * names which brief section the shape comes from.
 */
const NEAR_FUTURE_TARGETS: Array<{ target: string; via: string }> = [
  { target: "je vais parler", via: "brief §2.1 L1 debut sentence" },
  { target: "tu vas manger", via: "brief §4 L2/L5 shape (tu vas + infinitive)" },
  { target: "on va visiter Paris", via: "brief §4 L6 bridge card shape (on va + infinitive)" },
  { target: "il va habiter ici", via: "brief §3/§4 L4 debut (il va)" },
  { target: "elle va parler", via: "brief §3/§4 L5 debut (elle va)" },
];

describe("FR speech near-future grading — aller + infinitif (2026-09-10)", () => {
  describe("baseline: authored transcript is always exact", () => {
    it.each(NEAR_FUTURE_TARGETS)("$target", ({ target }) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("accepted hearings: colloquial reduction and -er/-é/-ez homophone spellings", () => {
    it('«je vais parler» — contracted "j\'vais parler" passes (perfect, 0.917)', () => {
      const r = grade("je vais parler", "j'vais parler");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.917, 2);
    });

    it('«je vais parler» — phonetic respelling of vais, "je vé parler", passes (close, 0.75)', () => {
      const r = grade("je vais parler", "je vé parler");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBe(0.75);
    });

    it('«tu vas manger» — s-dropped "tu va manger" passes (perfect, 0.909)', () => {
      const r = grade("tu vas manger", "tu va manger");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.909, 2);
    });

    it('«on va visiter Paris» — participle-homophone spelling "on va visité Paris" passes (perfect, 0.875)', () => {
      const r = grade("on va visiter Paris", "on va visité Paris");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.875, 2);
    });

    it('«il va habiter ici» — participle-homophone spelling "il va habité ici" passes (perfect, 0.857)', () => {
      const r = grade("il va habiter ici", "il va habité ici");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.857, 2);
    });

    it('«tu vas manger» — vous-form homophone spelling "tu vas mangez" passes (perfect, 0.909)', () => {
      const r = grade("tu vas manger", "tu vas mangez");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.909, 2);
    });

    it('«je vais parler» — vous-form homophone spelling "je vais parlez" passes (perfect, 0.917)', () => {
      const r = grade("je vais parler", "je vais parlez");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.917, 2);
    });
  });

  describe("infinitive-vs-participle homophony — must NOT be rejected (same sound), documented", () => {
    // «parler»/«parlé» share the identical [e] sound in natural speech — an
    // ASR transcript spelling the infinitive as the participle (or vice
    // versa) is not a pronunciation error and must never be graded wrong.
    it('«je vais parler» vs transcript "je vais parlé" passes (close, 0.833)', () => {
      const r = grade("je vais parler", "je vais parlé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.833, 2);
    });

    it('«elle va parler» vs transcript "elle va parlé" passes (close, 0.833)', () => {
      const r = grade("elle va parler", "elle va parlé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.833, 2);
    });

    it('«tu vas manger» vs transcript "tu vas mangé" passes (close, 0.818)', () => {
      const r = grade("tu vas manger", "tu vas mangé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.818, 2);
    });

    it('bare «parler» vs «parlé» passes (close, 0.667) — the lowest measured passing score in this file, still clear of the 0.55 floor', () => {
      const r = grade("parler", "parlé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.667, 2);
    });
  });

  describe("NOT PATCHED — documented near-miss false positives (constraints, not bugs)", () => {
    // Every score below was measured against the real scorer. Each is the
    // same structural limitation `frSpeechNegation.test.ts` already
    // documented for jamais/rien/mais — fixing any of them means either
    // raising PARTIAL_COVERAGE_FLOOR (moves every language's substring
    // tier) or adding edit-distance/phonetic awareness (the module's own
    // deferred "Future replacement"), not a small targeted change. Left
    // as-is; surfaced as authoring constraints in
    // docs/fr-speech-near-future-2026-09-10.md instead.

    it('«je vais» vs «je vois» ("I\'m going" vs "I see") as bare words scores CLOSE — false positive', () => {
      const r = grade("je vais", "je vois");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.833, 2);
    });

    it('«je vais parler» vs «je vois parler» embedded in a sentence scores PERFECT — false positive persists (and worsens)', () => {
      const r = grade("je vais parler", "je vois parler");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.917, 2);
    });

    it('«il va» vs «il y a» ("he\'s going" vs "there is") as bare words scores CLOSE — false positive', () => {
      const r = grade("il va", "il y a");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBe(0.75);
    });

    it('«il va habiter ici» vs «il y a habiter ici» embedded in a sentence scores PERFECT — false positive persists (and worsens)', () => {
      const r = grade("il va habiter ici", "il y a habiter ici");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.929, 2);
    });

    it('«il va» vs «il a» (aller/avoir minimal pair) as bare words scores CLOSE — false positive', () => {
      const r = grade("il va", "il a");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBe(0.75);
    });

    it('«on va manger» vs «on a manger» embedded in a sentence scores PERFECT — false positive', () => {
      const r = grade("on va manger", "on a manger");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.9, 2);
    });

    it('«elle va parler» vs «il va parler» (gender swap) embedded in a sentence scores CLOSE — false positive, sentence-shape-dependent (see next test)', () => {
      const r = grade("elle va parler", "il va parler");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBe(0.75);
    });

    it('compounded worst case — «j\'vé parlé» for «je vais parler» (contraction + vais-respelling + participle-respelling stacked) drops to TRY-AGAIN, 0.5 — each degradation alone passes, but stacking three at once does not', () => {
      const r = grade("je vais parler", "j'vé parlé");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0.5);
    });
  });

  describe("true negatives: gender swap at phrase level, and unrelated sentences correctly fail (sanity check)", () => {
    // Proves the scorer isn't hopelessly lenient. Notably, the SAME
    // «il va»/«elle va» gender swap that passes once embedded in a
    // sentence (above) correctly fails at the bare 2-word phrase level —
    // the same sentence-shape-dependent inconsistency
    // `frSpeechNegation.test.ts` documented for jamais/rien.
    it('«elle va» vs «il va» as a bare phrase correctly fails (try-again, 0.5)', () => {
      const r = grade("elle va", "il va");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0.5);
    });

    it('«il va habiter ici» vs an unrelated sentence correctly fails (try-again, 0.412)', () => {
      const r = grade("il va habiter ici", "elle va manger là-bas");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.412, 2);
    });

    it('«on va visiter Paris» vs an unrelated sentence correctly fails (try-again, 0.5)', () => {
      const r = grade("on va visiter Paris", "tu vas manger");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0.5);
    });
  });
});
