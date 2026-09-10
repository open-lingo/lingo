/**
 * FR speech grading of `pas`-negated frames graded at a `speaking`
 * checkpoint in m13–m20, incl. the m19 near-future
 * («je ne vais pas manger de gâteau») and m20 recent-past
 * («il ne vient pas de manger de gâteau») frames the m20 reviewer (commit
 * 3004d96f) flagged as unverified (2026-09-10).
 *
 * Background: `frSpeechNegation.test.ts` traced the general fuzzy speech
 * matcher (`scoreAlternativesGeneric` in `src/shared/speech/loose-match.ts`)
 * against the m18 `jamais`/`rien`/`plus` fillers, but its `NEGATION_TARGETS`
 * table contains ZERO `pas` sentences — the base `ne … pas` frame m13
 * introduces, and every later module (m14–m16, m19, m20) reuses verbatim,
 * has never been traced for the specific question this file answers: does
 * the matcher tell a negated sentence apart from its un-negated
 * counterpart? `frSpeechElision.test.ts` traces `pas` targets too, but only
 * for elision/de-elision robustness (does "je n ai pas" still match "je
 * n'ai pas") — it never compares a `pas` target against the TRUTH-FLIPPED
 * sentence with the negation removed, which is this file's subject.
 *
 * CENSUS (read-only grep of `speaking(` calls with "ne "/"n'"/" pas"/
 * "jamais"/"rien"/"plus" targets across m13.ts–m20.ts; recall-only repeats
 * of an id already listed are folded into that row's `via`):
 *
 *   `pas`-frame (this file's subject — 14 distinct targets):
 *     m13: fr-m13-1-speak-jenesaispas "je ne sais pas" (+m13-10 recall)
 *          fr-m13-2-speak-ilneparle "il ne parle pas" (+m13-5/14-7/15-6/16-5
 *            recalls)
 *          fr-m13-3-speak-tunaimes "tu n'aimes pas la pizza"
 *          fr-m13-5-speak-naipasdelivre "je n'ai pas de livre"
 *          fr-m13-6-speak-cenestpas "ce n'est pas un musée"
 *          fr-m13-8-speak-jenaimepas "je n'aime pas le chocolat"
 *     m14: fr-m14-6-speak-tunaspas "tu n'as pas mangé hier soir" (+m14-10/
 *            15-7/15-10/16-10 recalls)
 *          fr-m14-7-speak-pasencore "je n'ai pas encore mangé"
 *     m15: fr-m15-6-speak-tunevisitepas "tu ne visites pas l'école"
 *          fr-m15-7-speak-tunaspasvisite "tu n'as pas visité la halle"
 *     m16: fr-m16-6-speak-ilnestpasvenu "il n'est pas venu de Paris"
 *            (+m16-6 recall "je ne comprends pas")
 *          fr-m16-7-speak-pasencorevenu "il n'est pas encore venu de Paris"
 *     m19: fr-m19-8-speak-jenevaispasmanger "je ne vais pas manger de
 *            gâteau" — THE near-future negated frame this task names
 *     m20: fr-m20-8-speak-ilnevientpas "il ne vient pas de manger de
 *            gâteau" — THE recent-past negated frame this task names
 *
 *   `jamais`/`rien`/`plus`-frame (m18, 15 distinct targets) — already
 *     traced by `frSpeechNegation.test.ts` (ne-drop generalization,
 *     rien/bien, jamais/mais, jamais/rien cross-swap, encore/plus). NOT
 *     duplicated here.
 *
 * FINDINGS (every score below measured against the REAL scorer,
 * `Math.round(...*1000)/1000`, reproduced from a throwaway probe run
 * against this exact code — full detail:
 * `docs/fr-speech-negated-frames-2026-09-10.md`):
 *
 * (a) Ne-drop on `pas` targets generalizes exactly like the m18 fillers
 *     already found — "il parle pas" for "il ne parle pas" (0.833, close),
 *     "je vais pas manger de gâteau" for the m19 target (0.92, perfect),
 *     "il vient pas de manger de gâteau" for the m20 target (0.929,
 *     perfect). No fix needed.
 *
 * (b)/(c) NEW, more severe than anything `frSpeechNegation.test.ts` or
 *     `frSpeechNearFuture.test.ts`/`frSpeechRecentPast.test.ts` found:
 *     dropping the ENTIRE negation (`ne … pas` gone, no filler substituted
 *     — the plain, unmarked, truth-flipped affirmative) scores "close" (a
 *     PASS) in both directions, on every target tested:
 *       - negated target, un-negated hearing: "il vient de manger de
 *         gâteau" for "il ne vient pas de manger de gâteau" scores 0.821
 *         (close). "je vais manger de gâteau" for the m19 target scores
 *         0.8 (close). "il parle" for "il ne parle pas" scores 0.583
 *         (close, barely — this is the shortest target, and the LOWEST
 *         margin above the 0.55 floor measured in this file).
 *       - un-negated target, negated hearing: "il ne va pas manger une
 *         pizza" for the real sibling target "il va manger une pizza"
 *         (fr-m19-8-speak-ilvamanger) scores 0.783 (close). "elle ne vient
 *         pas de manger une pizza" for the real target "elle vient de
 *         manger une pizza" (fr-m20-6-speak-vientdemanger) scores 0.833
 *         (close). "il ne parle pas français" for "il parle français"
 *         scores 0.75 (close).
 *     Answers the task's (b) question directly: "pas" alone is NOT enough
 *     signal — sentence padding absorbs it in every direction, and MORE
 *     padding makes it WORSE, not better (see "padding" describe block
 *     below: 0.821 for a 7-word sentence rises to 0.902 for an 11-word
 *     one — the same direction `frSpeechHundreds.test.ts` already found
 *     for its own false-positive class).
 *
 * (d) Article collapse under negation (`de gâteau` vs `un gâteau`, the
 *     partitive-vs-indefinite swap negation triggers) is NOT penalized
 *     either direction, same measured leniency `frSpeechElision.test.ts`
 *     found for elision generally — 0.92–0.929, perfect. This is fine,
 *     expected leniency, not a defect: it doesn't touch truth value.
 *
 * (e) Negator swaps (pas↔jamais, pas↔plus) embedded in the SAME m19/m20
 *     sentence frame: NOT covered by `frSpeechNegation.test.ts` (its
 *     table has no `pas` targets to swap FROM) — new data point here, and
 *     it is WORSE than that file's jamais/rien cross-swap finding (0.643,
 *     "close"): every `pas`↔`jamais`/`plus` swap tested in the m19/m20
 *     frame scores PERFECT (0.857–0.931), not merely "close". The bare
 *     2-word negator swap ("pas" vs "jamais"/"plus"/"rien") correctly
 *     fails (0–0.5, try-again) — same sentence-shape-dependent
 *     inconsistency class every sibling file has already documented.
 *
 * DECISION: NOT PATCHED. A guard that would catch (b)/(c)/(e) is a
 * fundamentally different KIND of change than every fix this matcher has
 * taken so far (curly-apostrophe fold, digit→word number tables): those
 * are all provably safe because they only ADD an equivalence — a
 * fail can become a pass, but a pass can never become a fail. A
 * negation-token guard is the opposite: it must SUBTRACT score whenever a
 * negator appears on only one side, which risks turning some currently-
 * legitimate pass into a fail wherever the heuristic is wrong. Making it
 * safe would require: (1) per-language negator word lists (the existing
 * per-language tables in this file — `ROMANCE_NUMBER_WORDS`,
 * `KO_NATIVE_COUNTER` — are all digit tables, none are free-text word
 * lists with this risk profile), (2) real word-boundary tokenization on
 * PRE-normalized text (post-`normalizeGeneric` strings have NO spaces at
 * all — `GENERIC_PUNCT_RE` strips `\s` — so a substring check on the
 * normalized string would reintroduce the exact "mais-inside-jamais" trap
 * `frSpeechNegation.test.ts` already documented, e.g. "pas" is a substring
 * of "repas"/"passer"), and (3) full-suite verification that no existing
 * es/ko/fr `speaking` step regresses. That is "matcher-wide... not a small
 * targeted change" — the same threshold `frSpeechNegation.test.ts`,
 * `frSpeechNearFuture.test.ts`, and `frSpeechRecentPast.test.ts` already
 * used to decline patching their own near-miss false positives. This file
 * extends that same precedent to the `pas` frame; `loose-match.ts` is
 * UNCHANGED.
 *
 * None of the above regress `frSpeechElision.test.ts`, `frSpeechNegation
 * .test.ts`, `frSpeechNearFuture.test.ts`, `frSpeechRecentPast.test.ts`, or
 * `frSpeechHundreds.test.ts` (all stay green, run in the same gate below).
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";

function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

/** Every distinct `pas`-frame `speaking` target across m13.ts–m20.ts, per
 *  the census above. `via` names the lesson id grep found it under. */
const PAS_TARGETS: Array<{ target: string; via: string }> = [
  { target: "je ne sais pas", via: "fr-m13-1-speak-jenesaispas (+m13-10 recall)" },
  { target: "il ne parle pas", via: "fr-m13-2-speak-ilneparle (+m13-5/14-7/15-6/16-5 recalls)" },
  { target: "tu n'aimes pas la pizza", via: "fr-m13-3-speak-tunaimes" },
  { target: "je n'ai pas de livre", via: "fr-m13-5-speak-naipasdelivre" },
  { target: "ce n'est pas un musée", via: "fr-m13-6-speak-cenestpas" },
  { target: "je n'aime pas le chocolat", via: "fr-m13-8-speak-jenaimepas" },
  { target: "tu n'as pas mangé hier soir", via: "fr-m14-6-speak-tunaspas (+m14-10/15-7/15-10/16-10 recalls)" },
  { target: "je n'ai pas encore mangé", via: "fr-m14-7-speak-pasencore" },
  { target: "tu ne visites pas l'école", via: "fr-m15-6-speak-tunevisitepas" },
  { target: "tu n'as pas visité la halle", via: "fr-m15-7-speak-tunaspasvisite" },
  { target: "il n'est pas venu de Paris", via: "fr-m16-6-speak-ilnestpasvenu" },
  { target: "il n'est pas encore venu de Paris", via: "fr-m16-7-speak-pasencorevenu" },
  { target: "je ne vais pas manger de gâteau", via: "fr-m19-8-speak-jenevaispasmanger (near-future, task-named)" },
  { target: "il ne vient pas de manger de gâteau", via: "fr-m20-8-speak-ilnevientpas (recent-past, task-named)" },
];

describe("FR speech negated-frame grading — pas (2026-09-10)", () => {
  describe("baseline: authored transcript is always exact", () => {
    it.each(PAS_TARGETS)("$target", ({ target }) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("(a) accepted hearings: colloquial ne-drop passes, same class as frSpeechElision/frSpeechNegation", () => {
    it('«il ne parle pas» → ne-dropped "il parle pas" passes (close, 0.833)', () => {
      const r = grade("il ne parle pas", "il parle pas");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.833, 2);
    });

    it('«je ne vais pas manger de gâteau» (m19) → ne-dropped "je vais pas manger de gâteau" passes (perfect, 0.92)', () => {
      const r = grade("je ne vais pas manger de gâteau", "je vais pas manger de gâteau");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.92, 2);
    });

    it('«il ne vient pas de manger de gâteau» (m20) → ne-dropped "il vient pas de manger de gâteau" passes (perfect, 0.929)', () => {
      const r = grade("il ne vient pas de manger de gâteau", "il vient pas de manger de gâteau");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.929, 2);
    });

    it('«tu n\'as pas mangé hier soir» → ne-dropped "tu as pas mangé hier soir" passes (perfect, 0.952)', () => {
      const r = grade("tu n'as pas mangé hier soir", "tu as pas mangé hier soir");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.952, 2);
    });

    it('«ce n\'est pas un musée» → ne-dropped "c\'est pas un musée" passes (perfect, 0.875)', () => {
      const r = grade("ce n'est pas un musée", "c'est pas un musée");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.875, 2);
    });
  });

  describe("(b)/(c) NOT PATCHED — negated vs un-negated cross-check both false-positive (constraint, not a bug fixed here)", () => {
    // Every score below was measured against the real scorer. See file
    // header "DECISION" for why this is documented, not patched.

    it('(b) negated target "il ne vient pas de manger de gâteau" vs un-negated hearing "il vient de manger de gâteau" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("il ne vient pas de manger de gâteau", "il vient de manger de gâteau");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.821, 2);
    });

    it('(b) negated m19 target "je ne vais pas manger de gâteau" vs un-negated hearing "je vais manger de gâteau" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("je ne vais pas manger de gâteau", "je vais manger de gâteau");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.8, 2);
    });

    it('(b) negated target "il ne parle pas" vs un-negated hearing "il parle" scores CLOSE — the lowest margin above the 0.55 floor measured in this file', () => {
      const r = grade("il ne parle pas", "il parle");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.583, 2);
    });

    it('(b) negated target "tu n\'as pas mangé hier soir" vs un-negated hearing "tu as mangé hier soir" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("tu n'as pas mangé hier soir", "tu as mangé hier soir");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.81, 2);
    });

    it('(c) un-negated real sibling target "il va manger une pizza" (fr-m19-8-speak-ilvamanger) vs negated hearing "il ne va pas manger une pizza" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("il va manger une pizza", "il ne va pas manger une pizza");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.783, 2);
    });

    it('(c) un-negated real sibling target "elle vient de manger une pizza" (fr-m20-6-speak-vientdemanger) vs negated hearing "elle ne vient pas de manger une pizza" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("elle vient de manger une pizza", "elle ne vient pas de manger une pizza");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.833, 2);
    });

    it('(c) un-negated target "il parle français" vs negated hearing "il ne parle pas français" scores CLOSE — opposite meaning marked correct', () => {
      const r = grade("il parle français", "il ne parle pas français");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.75, 2);
    });
  });

  describe("(b) padding: a longer negated sentence makes the false positive WORSE, not better — 'pas' alone is not enough signal", () => {
    it('a longer padded negated target loses the un-negated-hearing false positive to an even higher score (0.902, still under the 0.85 perfect... no, over it)', () => {
      const shorter = grade("il ne vient pas de manger de gâteau", "il vient de manger de gâteau");
      const longer = grade(
        "il ne vient pas de manger de gâteau au chocolat avec sa famille",
        "il vient de manger de gâteau au chocolat avec sa famille",
      );
      expect(shorter.verdict).toBe("close");
      expect(shorter.bestScore).toBeCloseTo(0.821, 2);
      // More padding around the missing negator raises the score further —
      // same "embedding makes it worse, not better" direction
      // `frSpeechNearFuture.test.ts` and `frSpeechHundreds.test.ts` already
      // found for their own false-positive classes.
      expect(longer.verdict).toBe("perfect");
      expect(longer.bestScore).toBeCloseTo(0.902, 2);
      expect(longer.bestScore).toBeGreaterThan(shorter.bestScore);
    });
  });

  describe("(d) article collapse under negation («de» vs «un»/«une») is NOT penalized either direction — expected leniency, not a defect", () => {
    it('«il ne vient pas de manger de gâteau» vs «...un gâteau» passes (perfect, 0.929) — partitive/indefinite swap does not touch truth value', () => {
      const r = grade("il ne vient pas de manger de gâteau", "il ne vient pas de manger un gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.929, 2);
    });

    it('«je ne vais pas manger de gâteau» vs «...un gâteau» passes (perfect, 0.92)', () => {
      const r = grade("je ne vais pas manger de gâteau", "je ne vais pas manger un gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.92, 2);
    });

    it('«je n\'ai pas de livre» vs «je n\'ai pas un livre» passes (perfect, 0.867)', () => {
      const r = grade("je n'ai pas de livre", "je n'ai pas un livre");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.867, 2);
    });
  });

  describe("(e) NOT PATCHED — negator swap within the m19/m20 frame scores PERFECT, worse than frSpeechNegation's jamais/rien cross-swap finding", () => {
    // frSpeechNegation.test.ts's NEGATION_TARGETS table has no `pas` targets
    // to swap FROM, so this specific swap (pas → jamais/plus in a m19/m20
    // shaped sentence) is new coverage, not a duplicate of that file's
    // jamais/rien cross-swap block.
    it('«je ne vais pas manger de gâteau» vs «je ne vais jamais manger de gâteau» scores PERFECT — worse than the 0.643 "close" frSpeechNegation found for jamais/rien', () => {
      const r = grade("je ne vais pas manger de gâteau", "je ne vais jamais manger de gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.857, 2);
    });

    it('«je ne vais pas manger de gâteau» vs «je ne vais plus manger de gâteau» scores PERFECT', () => {
      const r = grade("je ne vais pas manger de gâteau", "je ne vais plus manger de gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.923, 2);
    });

    it('«il ne vient pas de manger de gâteau» vs «il ne vient jamais de manger de gâteau» scores PERFECT', () => {
      const r = grade("il ne vient pas de manger de gâteau", "il ne vient jamais de manger de gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.871, 2);
    });

    it('«il ne vient pas de manger de gâteau» vs «il ne vient plus de manger de gâteau» scores PERFECT', () => {
      const r = grade("il ne vient pas de manger de gâteau", "il ne vient plus de manger de gâteau");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBeCloseTo(0.931, 2);
    });
  });

  describe("true negatives: bare negator swap and unrelated sentences correctly fail (sanity check)", () => {
    // Proves the scorer isn't hopelessly lenient at the phrase level — same
    // sentence-shape-dependent inconsistency `frSpeechNegation.test.ts` and
    // `frSpeechNearFuture.test.ts` already documented for their own swaps.
    const cases: Array<[string, string]> = [
      ["pas", "jamais"],
      ["pas", "plus"],
      ["pas", "rien"],
    ];
    it.each(cases)("bare negator target=%s transcript=%s → try-again", (target, transcript) => {
      const r = grade(target, transcript);
      expect(r.verdict).toBe("try-again");
    });

    it('«je ne vais pas manger de gâteau» vs an unrelated sentence correctly fails', () => {
      const r = grade("je ne vais pas manger de gâteau", "tu as visité la gare");
      expect(r.verdict).toBe("try-again");
    });
  });
});
