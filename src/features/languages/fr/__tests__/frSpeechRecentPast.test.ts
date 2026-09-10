/**
 * FR speech grading of the recent-past frame («venir de + infinitif») —
 * verification for `docs/fr-m20-brief-2026-09-10.md`'s §6/§7 explicit
 * requirement (2026-09-10).
 *
 * Background: the m20 brief («Je viens de parler») fronts a bare infinitive
 * after four new subject-chunk atoms (`je viens de`, `tu viens de`,
 * `il vient de`, `elle vient de`) and flags, as a REQUIRED-before-any-
 * speech-grading-confidence item (§7), that — unlike m17's numbers, m18's
 * negators (`frSpeechNegation.test.ts`), and m19's near-future
 * (`frSpeechNearFuture.test.ts`) — nobody has run the general fuzzy speech
 * matcher (`scoreAlternativesGeneric` in `src/shared/speech/loose-match.ts`)
 * against sentences like "je viens de manger" / "il vient de visiter Paris."
 * This file is that trace, mirroring both precedents' method exactly — every
 * score below was measured against the REAL scorer (`Math.round(...*1000)/
 * 1000`, reproduced from a throwaway probe run against this exact code), not
 * asserted.
 *
 * FINDINGS SUMMARY (full detail: `docs/fr-speech-recent-past-2026-09-10.md`):
 *
 * 1. Colloquial subject-chunk reductions generalize cleanly, same class
 *    `frSpeechElision.test.ts`/`frSpeechNearFuture.test.ts` already verified:
 *    contracted "j'viens de manger" (0.933), s-dropped "je vien de manger"
 *    (0.933), the -er/-é participle-homophone group ("je viens de mangé",
 *    "tu viens de parlé", "il vient de visité Paris" — 0.867–0.905, all
 *    perfect, correctly NOT rejected since the sound is identical), and
 *    over-elision of "de" before a CONSONANT-onset infinitive ("je viens
 *    d'manger" — colloquial fast speech, 0.933) all pass with no code
 *    change.
 *
 * 2. `de`-vs-`d'` before a vowel-onset infinitive — the exact case the brief
 *    excluded `habiter`/`arriver` over (§1, §3) — the matcher copes FINE in
 *    both directions: a correctly-elided target ("il vient d'arriver") vs an
 *    un-elided ASR hearing ("il vient de arriver") scores 0.938 (perfect),
 *    and the reverse (grammatically-wrong un-elided target vs correctly-
 *    elided hearing) scores 0.952 (perfect). **The brief's exclusion of
 *    `habiter` was correctly not attributed to the speech grader — it is a
 *    written-grammar/authoring-correctness concern (an unelided "vient de
 *    habiter" is simply wrong French to put in front of a learner), not a
 *    grading gap.** No constraint needed here; confirmed, not merely assumed.
 *
 * 3. Four measured false-positive near-misses, none fixed (same structural
 *    class `frSpeechNegation.test.ts` and `frSpeechNearFuture.test.ts`
 *    already documented — bag-of-characters + substring-coverage scoring,
 *    not a targeted fold; fixing any of them needs edit-distance/phonetic
 *    awareness, matcher-wide, not a small change):
 *    - **`vient`/`viens` vs `bien`** (the brief's flagged near-minimal pair,
 *      §5) — the bare word ALONE, either direction, scores 0.6 ("close", a
 *      pass — "je bien de manger" is NOT rejected). Embedded in a full
 *      sentence it gets WORSE, not better: "je bien de manger" for "je
 *      viens de manger" scores 0.867 (perfect); "il bien de visiter Paris"
 *      for "il vient de visiter Paris" scores 0.905 (perfect). Answers the
 *      brief's §5 question directly: **no, "je bien de manger" is NOT
 *      rejected by this matcher.**
 *    - **`il vient de` / `elle vient de`** cross-subject (gender swap) — and
 *      here the finding is WORSE than m19's `il va`/`elle va` precedent:
 *      `frSpeechNearFuture.test.ts` found the bare 2-word phrase correctly
 *      fails (0.5) while only the embedded sentence passes (0.75). Here the
 *      BARE phrase already passes: "il vient de" vs "elle vient de" scores
 *      0.727 (close). The extra shared syllable count (`vientde` common to
 *      both) leaves proportionally less room for the `il`/`elle` swap to
 *      register as a full-string mismatch. Embedded in a full sentence it
 *      is 0.87 (perfect).
 *    - **`je viens de` / `tu viens de`** cross-subject — a NEW risk this
 *      module introduces that m19 did not have: the brief's own §4 flags
 *      `viens` is IDENTICAL spelling+sound for je/tu (a first for this
 *      course). Measured: "tu viens de manger" for "je viens de manger"
 *      scores 0.867 (perfect) — the `je`/`tu` swap (the only textual
 *      difference) is fully absorbed.
 *    - **`je viens de` (recent past) / `je vais` (m19 near future)** —
 *      "je vais manger" for "je viens de manger" scores 0.733 (close, a
 *      pass); the bare 2-word chunks "je viens" vs "je vais" score 0.714
 *      (close, a pass).
 *
 * 4. `je viens de` (recent past, this module) vs `je viens de` fronting a
 *    DIFFERENT complement — the origin sense (m2-ish, «je viens de Paris»)
 *    — is a genuine, sentence-shape-dependent confusion: "je viens de
 *    Paris" (origin) vs "je viens de manger" (recent past) scores 0.733
 *    (close, a pass) despite being semantically unrelated constructions
 *    that happen to share the three-word chunk. This is NOT an m20-specific
 *    defect to fix — the shared prefix is inherent to French, the same
 *    class of confusion `frSpeechNegation.test.ts` found for `jamais`/
 *    `rien` sharing a sentence frame.
 *
 * 5. Truncation and unrelated sentences correctly fail (sanity check): a
 *    learner who says only "je viens" for the full target "je viens de
 *    manger" scores 0.467 (try-again, correctly rejected — coverage 7/16
 *    chars is under the 0.6 partial-coverage floor). The module's own L6
 *    bridge-card discrimination pair (recent past vs passé composé, same
 *    verb) correctly fails: "elle a mangé" for "elle vient de manger"
 *    scores 0.471 (try-again). An unrelated sentence scores 0.429
 *    (try-again).
 *
 * 6. One sibling-risk footnote, NOT this module's defect: if a bare m2-style
 *    "je viens" (origin) target is EVER used elsewhere, a transcript that
 *    over-answers with a full "je viens de manger" sentence scores 1.0
 *    (perfect) via the containment tier (`substringScore`: target fully
 *    contained in a longer transcript always scores 1 — same documented
 *    behavior the JA docstring calls out for filler insertion). This is a
 *    property of any short target, not particular to `venir`; flagged for
 *    completeness, not actionable here since m20 authors only the LONGER
 *    "venir de" chunks as targets, never the bare "je viens" alone.
 *
 * None of 1–6 regress `frSpeechElision.test.ts`, `frSpeechNegation.test.ts`,
 * or `frSpeechNearFuture.test.ts` (all three stay green, unchanged, run in
 * the same gate below) — this file adds coverage, it does not touch
 * `loose-match.ts`.
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";

/** Grade an ASR transcript against `target` the exact way `SpeakingStepView`
 *  does for every non-JA course (fr included). Mirrors `frSpeechElision.test.ts`,
 *  `frSpeechNegation.test.ts`, and `frSpeechNearFuture.test.ts`. */
function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

/** A transcript "passes" a speaking step when verdict is perfect OR close —
 *  see `SpeakingStepView.tsx`: `passed = verdict === "perfect" || "close"`. */
function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

/**
 * Representative m20-shaped sentences: the four subject chunks (`je viens
 * de` debut L1, `tu viens de` debut L2, `il vient de` debut L4, `elle vient
 * de` debut L5) each fronting one of the three already-taught bare
 * infinitives named in the brief's §2/§4 lesson sketches (`parler` m11,
 * `manger` m14, `visiter` m15 — `habiter` explicitly excluded, §1/§3).
 * Illustrative for matcher coverage only (see file header) — `via` names
 * which brief section the shape comes from.
 */
const RECENT_PAST_TARGETS: Array<{ target: string; via: string }> = [
  { target: "je viens de manger", via: "brief §4.1/§4.6 L1/L6 bridge-card shape" },
  { target: "tu viens de parler", via: "brief §4.2 L2 debut (tu viens de + parler)" },
  { target: "il vient de visiter Paris", via: "brief §4.4 L4 debut (il vient de)" },
  { target: "elle vient de manger", via: "brief §4.5/§4.6 L5/L6 bridge-card shape" },
];

describe("FR speech recent-past grading — venir de + infinitif (2026-09-10)", () => {
  describe("baseline: authored transcript is always exact", () => {
    it.each(RECENT_PAST_TARGETS)("$target", ({ target }) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("accepted hearings: colloquial reduction and elided/glued forms", () => {
    it('«je viens de manger» — contracted "j\'viens de manger" passes (perfect, 0.933)', () => {
      const r = grade("je viens de manger", "j'viens de manger");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.933, 2);
    });

    it('«je viens de manger» — s-dropped "je vien de manger" passes (perfect, 0.933)', () => {
      const r = grade("je viens de manger", "je vien de manger");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.933, 2);
    });

    it('«je viens de manger» — over-elided (colloquial fast speech) "je viens d\'manger" passes (perfect, 0.933)', () => {
      const r = grade("je viens de manger", "je viens d'manger");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.933, 2);
    });

    it('«tu viens de parler» — contracted "t\'viens de parler" passes (perfect, 0.933)', () => {
      const r = grade("tu viens de parler", "t'viens de parler");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.933, 2);
    });

    it('«elle vient de manger» — s-dropped "elle vien de manger" passes (perfect, 0.941)', () => {
      const r = grade("elle vient de manger", "elle vien de manger");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.941, 2);
    });
  });

  describe("de-vs-d' before a vowel-onset infinitive — confirms the matcher copes fine (habiter/arriver were excluded for an authoring reason, not this)", () => {
    // The brief excludes `habiter` from this module's infinitive set because
    // an unelided "vient de habiter" is grammatically WRONG French to put in
    // front of a learner (§1 d'-elision trap) — a written-authoring concern.
    // These cases confirm that is the right call: the SPEECH grader itself
    // handles the de/d' elision leniently in both directions, so it was
    // never the matcher forcing the exclusion.
    it('«il vient d\'arriver» (correctly elided target) vs un-elided ASR hearing "il vient de arriver" passes (perfect, 0.938)', () => {
      const r = grade("il vient d'arriver", "il vient de arriver");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.938, 2);
    });

    it('«il vient d\'habiter Paris» (correctly elided target) vs un-elided ASR hearing "il vient de habiter Paris" passes (perfect, 0.952)', () => {
      const r = grade("il vient d'habiter Paris", "il vient de habiter Paris");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.952, 2);
    });

    it('reverse direction — grammatically-wrong unelided target "il vient de habiter Paris" vs correctly-elided hearing "il vient d\'habiter Paris" also passes (perfect, 0.952)', () => {
      const r = grade("il vient de habiter Paris", "il vient d'habiter Paris");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.952, 2);
    });
  });

  describe("infinitive-vs-participle homophony — must NOT be rejected (same sound), documented", () => {
    // «manger»/«mangé», «parler»/«parlé», «visiter»/«visité» share the
    // identical [e] sound in natural speech — an ASR transcript spelling
    // the infinitive as the participle is not a pronunciation error and
    // must never be graded wrong. Same class `frSpeechNearFuture.test.ts`
    // already verified for m19's aller frame.
    it('«je viens de manger» vs transcript "je viens de mangé" passes (perfect, 0.867)', () => {
      const r = grade("je viens de manger", "je viens de mangé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.867, 2);
    });

    it('«tu viens de parler» vs transcript "tu viens de parlé" passes (perfect, 0.867)', () => {
      const r = grade("tu viens de parler", "tu viens de parlé");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.867, 2);
    });

    it('«il vient de visiter Paris» vs transcript "il vient de visité Paris" passes (perfect, 0.905)', () => {
      const r = grade("il vient de visiter Paris", "il vient de visité Paris");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.905, 2);
    });
  });

  describe("NOT PATCHED — documented near-miss false positives (constraints, not bugs)", () => {
    // Every score below was measured against the real scorer. Each is the
    // same structural limitation `frSpeechNegation.test.ts` and
    // `frSpeechNearFuture.test.ts` already documented — fixing any of them
    // means either raising PARTIAL_COVERAGE_FLOOR (moves every language's
    // substring tier) or adding edit-distance/phonetic awareness
    // (matcher-wide), not a small targeted change. Left as-is; surfaced as
    // authoring constraints in docs/fr-speech-recent-past-2026-09-10.md
    // instead.

    it('«vient»/«viens» vs «bien» (the brief\'s flagged near-minimal pair) as bare words scores CLOSE both directions — false positive, answers §5: "je bien de manger" is NOT rejected', () => {
      const viens = grade("viens", "bien");
      const vient = grade("vient", "bien");
      expect(viens.verdict).toBe("close");
      expect(viens.bestScore).toBeCloseTo(0.6, 2);
      expect(vient.verdict).toBe("close");
      expect(vient.bestScore).toBeCloseTo(0.6, 2);
    });

    it('«je viens de manger» vs «je bien de manger» embedded in a full sentence scores PERFECT — false positive persists (and worsens)', () => {
      const r = grade("je viens de manger", "je bien de manger");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.867, 2);
    });

    it('«il vient de visiter Paris» vs «il bien de visiter Paris» embedded in a sentence scores PERFECT — false positive persists (and worsens)', () => {
      const r = grade("il vient de visiter Paris", "il bien de visiter Paris");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.905, 2);
    });

    it('«il vient de» vs «elle vient de» (gender swap) as a BARE phrase scores CLOSE — worse than m19\'s aller precedent, where the bare phrase correctly failed', () => {
      const r = grade("il vient de", "elle vient de");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.727, 2);
    });

    it('«il vient de visiter Paris» vs «elle vient de visiter Paris» embedded in a sentence scores PERFECT — false positive persists (and worsens)', () => {
      const r = grade("il vient de visiter Paris", "elle vient de visiter Paris");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.87, 2);
    });

    it('«je viens de manger» vs «tu viens de manger» (je/tu cross-subject — «viens» is literally identical spelling+sound for both) scores PERFECT — false positive, new risk class this module introduces', () => {
      const r = grade("je viens de manger", "tu viens de manger");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.867, 2);
    });

    it('«je viens» vs «je vais» (recent-past chunk vs m19 near-future chunk) as bare words scores CLOSE — false positive', () => {
      const r = grade("je viens", "je vais");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.714, 2);
    });

    it('«je viens de manger» vs «je vais manger» (recent past vs near future, full sentence) scores CLOSE — false positive', () => {
      const r = grade("je viens de manger", "je vais manger");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.733, 2);
    });

    it('«je viens de Paris» (m2-ish origin sense) vs «je viens de manger» (recent-past sense) scores CLOSE — the two constructions share a 3-word chunk and are conflated', () => {
      const r = grade("je viens de Paris", "je viens de manger");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.733, 2);
    });
  });

  describe("true negatives: truncation, the module's own bridge-card pair, and unrelated sentences correctly fail (sanity check)", () => {
    it('«je viens de manger» vs a truncated "je viens" (learner stops early) correctly fails (try-again, 0.467)', () => {
      const r = grade("je viens de manger", "je viens");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.467, 2);
    });

    it('«elle vient de manger» (recent past) vs «elle a mangé» (passé composé, the module\'s own L6 bridge-card discrimination pair) correctly fails (try-again, 0.471)', () => {
      const r = grade("elle vient de manger", "elle a mangé");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.471, 2);
    });

    it('«il vient de visiter Paris» vs an unrelated sentence correctly fails (try-again, 0.429)', () => {
      const r = grade("il vient de visiter Paris", "elle va manger là-bas");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.429, 2);
    });
  });

  describe("sibling-risk footnote — NOT this module's defect: a short m2-style bare «je viens» target absorbs a longer transcript", () => {
    // If a bare "je viens" (origin sense, m2) target were ever graded
    // against a transcript that over-answers with a full recent-past
    // sentence, the containment tier scores it perfect — the same
    // documented "target inside a longer transcript" behavior the JA
    // docstring calls out for filler insertion. m20 never authors the bare
    // "je viens" as a speaking target (only the longer "venir de" chunks),
    // so this is not actionable here — flagged for completeness per the
    // brief's explicit "je viens de vs plain je viens" question.
    it('«je viens» (short target) vs «je viens de manger» (longer transcript) scores PERFECT via containment — not m20\'s problem, m20 never targets the bare phrase', () => {
      const r = grade("je viens", "je viens de manger");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });
});
