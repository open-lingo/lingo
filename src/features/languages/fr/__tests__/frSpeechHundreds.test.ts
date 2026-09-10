/**
 * FR speech grading of hundreds/thousands («cent», «deux cents», «cent un»,
 * «mille») — verification for `docs/fr-m21-brief-2026-09-10.md`'s §6/§9
 * "Speech probe wanted: YES" table (2026-09-10).
 *
 * Background: the m21 brief («De cent à mille») did NOT run a real
 * `scoreAlternativesGeneric` probe — it reasoned from code that
 * `ROMANCE_NUMBER_WORDS` (`src/shared/speech/loose-match.ts`) covered only
 * indices 0-20 and `ROMANCE_DIGIT_RE` only consumed 1-2 digit chunks, so a
 * Whisper ITN transcript like "100"/"101"/"1000" would fail to fold back to
 * «cent»/«cent un»/«mille». This file is that trace, mirroring
 * `frSpeechRecentPast.test.ts`'s method exactly — every score below was
 * measured against the REAL scorer via a throwaway probe run against this
 * exact code, not asserted.
 *
 * FINDINGS SUMMARY (full detail: `docs/fr-speech-hundreds-2026-09-10.md`):
 *
 * 1. The brief's predicted risk was CONFIRMED at baseline: round bare
 *    multiples ("100", "200", ..., "900", "1000", "2000") all scored 0
 *    against their word targets («cent», «deux cents», ..., «mille», «deux
 *    mille») — the 3-4 digit ITN token was either left fully untouched (no
 *    entry in the 0-20 table) or, for composites, chunked into nonsense
 *    ("101" → "10"+"1" → "dix"+"un").
 *
 * 2. **Matcher change made** (small, table-driven, language-generic — see
 *    `loose-match.ts`'s `ROMANCE_ROUND_HUNDREDS_WORDS` / `foldRoundHundreds`):
 *    a second lookup table + a dedicated exact-match regex folds ONLY exact
 *    round hundreds/thousands (100/200/.../900, 1000/2000/.../9000) to the
 *    target-appropriate word form, for BOTH fr and es, before the existing
 *    1-2 digit chunker runs. This is the same "target-aware, no-op when
 *    absent" contract `numbersToRomance` already used for 0-20 — not a
 *    number-to-words composer. After the fix, every ROUND bare-multiple
 *    case below passes; composite numbers (cent un, deux cent cinquante,
 *    ...) are UNCHANGED (still fail) — composing those needs real
 *    number-to-words logic with per-language agreement rules (cient-o/-os
 *    vs cent/cents, irregular es quinientos/setecientos/novecientos), which
 *    is genuinely language-specific and out of scope for a lookup table.
 *
 * 3. `cent`/`cents` bare homophone (§5 of the brief): the two spellings are
 *    genuinely pronounced identically in French, so the matcher correctly
 *    can't (and shouldn't try to) discriminate them from the bare word
 *    alone — this is a real teaching constraint, not a matcher defect.
 *
 * 4. `deux cents euros` (liaison) vs `deux cent` + pause: the matcher does
 *    NOT penalize a learner for producing or omitting the liaison, same
 *    leniency doctrine `frSpeechElision.test.ts` established for de-elision
 *    — pronunciation variance is not a content error.
 *
 * 5. `cent` vs `sans`/`sang` (all [sɑ̃]): the bare word is correctly
 *    rejected (0.25, try-again) — NOT a false positive on its own. But
 *    embedded in a full sentence ("j'ai cent euros" target vs "j'ai sans
 *    euros" heard) it becomes a false positive (0.75, close/pass) — the
 *    surrounding words pad the score past the partial-coverage floor
 *    regardless of the homophone swap. This is the SAME structural class
 *    `frSpeechNegation.test.ts`/`frSpeechRecentPast.test.ts` already
 *    documented (bag-of-characters + substring-coverage, not phonetically
 *    aware) — not fixed, not fixable without matcher-wide edit-distance
 *    work.
 *
 * 6. **Composite hundreds are UNSAFE for speaking even embedded in a full
 *    sentence, and worse than "doesn't recognize the right answer" — they
 *    ALSO accept a WRONG number.** "j'ai cent un euros" (target) vs "j'ai
 *    205 euros" and vs "j'ai 999 euros" (both wrong numbers, digit ITN)
 *    BOTH score 0.571 (close, pass) — the sentence padding around the
 *    unfolded digit token is enough to pass regardless of which digits
 *    are actually heard. This is a strictly stronger reason to keep every
 *    composite-hundred sentence written-only than "the correct answer might
 *    be rejected" — a WRONG answer can be accepted too.
 *
 * 7. m17's 70-99 numbers (quatre-vingts, soixante-dix, quatre-vingt-dix)
 *    were independently re-measured against the same digit-ITN risk this
 *    module's brief flagged: all three still score 0 (try-again) against
 *    "80"/"70"/"90" digit transcripts — the array-bound gap applies to them
 *    too (this fix's new table only covers 100+, not 70-99, since m17's own
 *    brief never asked for that range and this brief is scoped to m21).
 *    **m17.ts ships ZERO `speaking` steps (grepped directly: `grep -c
 *    '"speaking"' m17.ts` = 0)** — so this is a real latent gap in the
 *    shared matcher but NOT a live production risk for m17 today; it only
 *    bites if a future module ever promotes 70-99 to a speaking target.
 *
 * None of 1-7 regress `frSpeechElision.test.ts`, `frSpeechNegation.test.ts`,
 * `frSpeechNearFuture.test.ts`, or `frSpeechRecentPast.test.ts` (all four
 * stay green, unchanged, run in the same gate) — this file's matcher change
 * is additive only (new table + new regex pass), verified against the full
 * `src/shared/speech` suite (`loose-match.test.ts`'s existing Romance-number
 * ITN tests, incl. the two-digit "10 → dix" and "digits stay digits when
 * absent" cases, all still pass unchanged).
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric } from "@/shared/speech";

/** Grade an ASR transcript against `target` the exact way `SpeakingStepView`
 *  does for every non-JA course (fr included). Mirrors `frSpeechElision.test.ts`,
 *  `frSpeechNegation.test.ts`, `frSpeechNearFuture.test.ts`, and
 *  `frSpeechRecentPast.test.ts`. */
function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

/** A transcript "passes" a speaking step when verdict is perfect OR close —
 *  see `SpeakingStepView.tsx`: `passed = verdict === "perfect" || "close"`. */
function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

describe("FR speech hundreds/thousands grading — cent/deux cents/mille (2026-09-10)", () => {
  describe("baseline: authored transcript is always exact", () => {
    it.each([
      "cent",
      "deux cents",
      "mille",
      "deux mille",
      "cent un",
      "deux cent cinquante",
    ])("%s", (target) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("FIXED: round bare-multiple digit-ITN transcripts now fold correctly (loose-match.ts change)", () => {
    it('«cent» vs Whisper ITN digit transcript "100" now passes (perfect, 1) — was 0 before the fix', () => {
      const r = grade("cent", "100");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«deux cents» vs transcript "200" now passes (perfect, 1) — was 0 before the fix', () => {
      const r = grade("deux cents", "200");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«trois cents» vs transcript "300" now passes (perfect, 1)', () => {
      const r = grade("trois cents", "300");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«neuf cents» vs transcript "900" now passes (perfect, 1)', () => {
      const r = grade("neuf cents", "900");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«mille» vs 4-digit transcript "1000" now passes (perfect, 1) — was 0 before the fix, the brief\'s highest-risk single case', () => {
      const r = grade("mille", "1000");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«deux mille» vs transcript "2000" now passes (perfect, 1)', () => {
      const r = grade("deux mille", "2000");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('round-multiple digit ITN embedded in the m12 price frame «ça coûte deux cents euros» vs "ça coûte 200 euros" now passes (perfect, 1)', () => {
      const r = grade("ça coûte deux cents euros", "ça coûte 200 euros");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«ça coûte mille euros» vs digit transcript "ça coûte 1000 euros" passes (perfect, 1)', () => {
      const r = grade("ça coûte mille euros", "ça coûte 1000 euros");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it("the fold is target-aware and stays a genuine no-op: a wrong round number still fails (deux cents vs 300)", () => {
      const r = grade("deux cents", "300");
      expect(passed(r.verdict)).toBe(false);
    });

    it("a round-hundred digit stays a literal digit (no false match) when the target has no number word at all", () => {
      const r = grade("bonjour", "100");
      expect(passed(r.verdict)).toBe(false);
    });
  });

  describe("NOT FIXABLE with a lookup table — composite numbers (cent un, deux cent cinquante, ...) stay unresolved, DOCUMENT as written-only", () => {
    // These need real number-to-words composition (agreement rules differ
    // by language — cent/cents vs cient-o/-os, irregular es quinientos/
    // setecientos/novecientos) — genuinely language-specific, larger than
    // a small generic table, per the brief's own carve-out. loose-match.ts
    // left unchanged for these.
    it('«cent un» vs digit transcript "101" still fails (try-again, 0.333) — 3-digit run chunks as "10"+"1" → nonsense fold', () => {
      const r = grade("cent un", "101");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.333, 2);
    });

    it('«deux cent un» vs digit transcript "201" still fails (try-again, 0.2)', () => {
      const r = grade("deux cent un", "201");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.2, 2);
    });

    it('«deux cent cinquante» vs digit transcript "250" still fails outright (try-again, 0) — the whole run is a round-hundreds-table miss AND a 1-2 digit chunker miss', () => {
      const r = grade("deux cent cinquante", "250");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0);
    });

    it('ES «ciento uno» (101) has the identical composite failure — confirms the gap is language-generic, not fr-specific', () => {
      const r = grade("ciento uno", "101");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.333, 2);
    });
  });

  describe("DANGEROUS, not just unrecognized — a composite-hundred sentence accepts a WRONG digit transcript too", () => {
    // Worse than a false negative: sentence padding around the unfolded
    // digit token is enough to pass a `speaking` step's threshold
    // regardless of which digits were actually heard. This alone rules out
    // ever promoting a composite-hundred sentence to `speaking`, independent
    // of whether the round-hundreds table gets extended further.
    it('«j\'ai cent un euros» (target, 101) vs a WRONG digit transcript "j\'ai 205 euros" false-positives (close, 0.571)', () => {
      const r = grade("j'ai cent un euros", "j'ai 205 euros");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.571, 2);
    });

    it('«j\'ai cent un euros» vs an even more wrong digit transcript "j\'ai 999 euros" ALSO false-positives (close, 0.571) — same score as the correct-ish 205 case, confirming the number itself is not being checked', () => {
      const r = grade("j'ai cent un euros", "j'ai 999 euros");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.571, 2);
    });

    it('a longer composite sentence («j\'ai deux cent cinquante euros») dilutes the padding enough to correctly fail for both a right-shaped and a wrong digit hearing (try-again, 0.32 both)', () => {
      const right = grade("j'ai deux cent cinquante euros", "j'ai 250 euros");
      const wrong = grade("j'ai deux cent cinquante euros", "j'ai 999 euros");
      expect(right.verdict).toBe("try-again");
      expect(right.bestScore).toBeCloseTo(0.32, 2);
      expect(wrong.verdict).toBe("try-again");
      expect(wrong.bestScore).toBeCloseTo(0.32, 2);
      // The point isn't "these two scores are equal" as a design goal — it's
      // that neither score is discriminating on the number at all. Flagged
      // as unsafe-by-luck (this sentence happens to fail), not unsafe-by-design
      // the way the shorter "cent un" sentence above passes by luck.
    });
  });

  describe("homophones — cent/cents (genuine, unfixable) and cent/sans/sang (ASR confusion, structural class)", () => {
    it('«cent» vs bare transcript "cents" scores PERFECT (1) — true homophone, not a bug: same [sɑ̃] sound, matcher correctly can\'t and shouldn\'t discriminate spelling alone', () => {
      const r = grade("cent", "cents");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('reverse direction — «cents» vs "cent" also scores PERFECT (1)', () => {
      const r = grade("cents", "cent");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('liaison leniency: «deux cents euros» (correct liaison) vs a hearing without it, "deux cent euros", is NOT penalized (perfect, 0.929) — same doctrine as de-elision leniency', () => {
      const r = grade("deux cents euros", "deux cent euros");
      expect(passed(r.verdict)).toBe(true);
      expect(r.bestScore).toBeCloseTo(0.929, 2);
    });

    it('«cent» vs the bare homophone "sans" (without) is correctly rejected on its own (try-again, 0.25) — no false positive at the bare-word level', () => {
      const r = grade("cent", "sans");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.25, 2);
    });

    it('«cent» vs the bare homophone "sang" (blood) is also correctly rejected on its own (try-again, 0.25)', () => {
      const r = grade("cent", "sang");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBeCloseTo(0.25, 2);
    });

    it('BUT embedded in a full sentence, «j\'ai cent euros» vs a "sans"-hearing "j\'ai sans euros" DOES false-positive (close, 0.75) — same structural class as vient/bien (frSpeechRecentPast), not fixed', () => {
      const r = grade("j'ai cent euros", "j'ai sans euros");
      expect(r.verdict).toBe("close");
      expect(r.bestScore).toBeCloseTo(0.75, 2);
    });

    it('«mille» vs the es-shaped truncation/near-hearing "mil" scores PERFECT (1) via substring containment — leniency-favoring, not a defect', () => {
      const r = grade("mille", "mil");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("m17 retro-check — 70-99 digit-ITN risk is real but NOT a live production risk (m17 ships zero speaking steps)", () => {
    // This fix's new round-hundreds table only covers 100+ (m21's scope);
    // 70-99 sits below it and is untouched, same as before.
    it('«quatre-vingts» (80) vs digit transcript "80" still fails (try-again, 0) — same array-bound gap as m21, unpatched here (out of this module\'s scope)', () => {
      const r = grade("quatre-vingts", "80");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0);
    });

    it('«soixante-dix» (70) vs digit transcript "70" still fails (try-again, 0)', () => {
      const r = grade("soixante-dix", "70");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0);
    });

    it('«quatre-vingt-dix» (90) vs digit transcript "90" still fails (try-again, 0)', () => {
      const r = grade("quatre-vingt-dix", "90");
      expect(r.verdict).toBe("try-again");
      expect(r.bestScore).toBe(0);
    });
  });

  describe("regression sanity: existing 0-20 Romance-number folding is untouched by the new round-hundreds pass", () => {
    it('two-digit "10 → dix" still resolves whole, unaffected by the wider regex pass', () => {
      const r = grade("dix", "10");
      expect(r.verdict).toBe("perfect");
    });

    it('a genuinely wrong small number still fails (trois vs 4)', () => {
      const r = grade("trois", "4");
      expect(passed(r.verdict)).toBe(false);
    });
  });
});
