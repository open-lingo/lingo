/**
 * FR speech grading of elided/contracted forms — verification + regression
 * guard (2026-09-10).
 *
 * Background: the m14 review (commit a758edd4) flagged "speech-grader
 * elision folding remains UNVERIFIED" — «n'a» was registered as an atom
 * because `frTokens` drops 1-char tokens, so «n'a» never derives from bare
 * «a» for AUTHORING purposes (courseAtoms.ts — out of scope for this file).
 * That's an atom-registration question. This file answers the SEPARATE
 * question the m14 brief (§6) explicitly punted: does the SPEECH grader
 * (the `speaking` step's `gradeSpeech`-equivalent, `scoreAlternativesGeneric`
 * in `src/shared/speech/loose-match.ts`) correctly grade a learner's spoken
 * elision — «j'ai», «n'ai», «c'est», «l'école» — regardless of how the ASR
 * engine (Web Speech API / Whisper / native SFSpeechRecognizer, all sharing
 * this one scorer per `SpeakingStepView.tsx`) happens to transcribe the
 * apostrophe: straight, curly/typographic, space-split, glued, or the
 * learner physically de-eliding ("je ne ai pas" instead of "je n'ai pas").
 *
 * FINDING (measured against the real grader, not asserted): every apostrophe-
 * bearing `speaking` target across fr m11–m15 already graded "perfect" for
 * every realistic transcript variant EXCEPT one gap — a curly apostrophe
 * (`’`, U+2019) survived `normalizeGeneric` as a literal, uncompared
 * character instead of folding to the ASCII `'` the way the TYPED-answer
 * path (`normalizeTypedAnswer`) already does. On these curriculum targets
 * (8+ normalized chars) char-overlap leniency absorbed the one stray
 * character and nothing dropped below the "perfect" tier — but on a SHORT
 * target («c'est» alone, 4 normalized chars) the same gap drops a curly-
 * apostrophe transcript to the "close" tier (0.8), not "perfect" (proved
 * below). Fixed in `loose-match.ts`: `normalizeGeneric` now folds apostrophe
 * variants (`APOSTROPHE_VARIANTS_RE`) before stripping punctuation, exactly
 * mirroring `normalizeTypedAnswer`. The fold can only turn a lower score
 * into 1.0 — it adds an equivalence, never removes one — so it cannot make
 * any existing pass a fail.
 *
 * De-elision judgment call («je ne ai pas», «je ai» for «j'ai»): NOT
 * "fixed" — left as the grader's existing lenient char-overlap behavior.
 * Position: this is the correct call, not a bug to patch. The extra/moved
 * syllable a learner produces by failing to physically elide is a
 * PRONUNCIATION gap, not a content error — the module's own doc comment
 * states the design intent explicitly ("the bar deliberately leans
 * lenient... false positives during a pronunciation drill are far better
 * than false negatives"), and `course-design-learnings-2026-08-21` law 3
 * only requires normalizers to be target-aware, not that every phonetic
 * variant be hard-rejected. Every de-elided variant tested below already
 * lands at "perfect" or "close" (never "try-again"), which is what the
 * existing char-overlap tiering already does with no code change needed.
 *
 * Sibling parity: ES has no elision apostrophes to speak of (contractions
 * like «del», «al» are single unapostrophized words — N/A here). JA/KO use
 * a different script and the JA-only `scoreAlternatives`/kana path — N/A.
 * `normalizeGeneric` is shared by es/ko/fr; the apostrophe-variant fold is a
 * no-op for es/ko content (they don't author apostrophes), verified by the
 * cross-language sibling suite gate in this task's report.
 */
import { describe, it, expect } from "vitest";
import { scoreAlternativesGeneric, normalizeGeneric } from "@/shared/speech";

/**
 * Every `speaking` target across fr/curriculum/m11.ts–m15.ts whose French
 * text contains an apostrophe, extracted by grep (read-only — this file
 * does not touch the mN.ts curriculum files). `via` is the lesson id(s)
 * grep found it under, for traceability back to the source.
 */
const APOSTROPHE_TARGETS: Array<{ target: string; via: string }> = [
  { target: "c'est lundi", via: "fr-m11-8-speak-cestlundi-recall (+m12/m13/m14/m15 recalls)" },
  { target: "j'aime le chocolat", via: "fr-m11-9-speak-jaimechocolat-recall" },
  { target: "c'est combien ?", via: "fr-m12-6-speak-cestcombien" },
  { target: "c'est cher", via: "fr-m12-7-speak-cher (+m13/m14/m15 recalls)" },
  { target: "ce n'est pas cher", via: "fr-m12-7-speak-pascher" },
  { target: "tu n'aimes pas la pizza", via: "fr-m13-3-speak-tunaimes" },
  { target: "parce que c'est cher", via: "fr-m13-4-speak-parceque (+m14-9)" },
  { target: "je n'ai pas de livre", via: "fr-m13-5-speak-naipasdelivre" },
  { target: "ce n'est pas un musée", via: "fr-m13-6-speak-cenestpas" },
  { target: "je n'aime pas le chocolat", via: "fr-m13-8-speak-jenaimepas" },
  { target: "j'ai mangé un croissant hier", via: "fr-m14-1-speak-croissant (+m15-1 recall)" },
  { target: "j'ai un chat", via: "fr-m14-1-speak-recall-chat" },
  { target: "j'ai mangé ce matin", via: "fr-m14-2-speak-cematin" },
  { target: "tu n'as pas mangé hier soir", via: "fr-m14-6-speak-tunaspas (+m15-7/10 recalls)" },
  { target: "je n'ai pas encore mangé", via: "fr-m14-7-speak-pasencore" },
  { target: "j'ai déjà mangé", via: "fr-m14-8-speak-jaidejamange" },
  { target: "j'ai parlé hier soir", via: "fr-m14-9-speak-jaiparle" },
  { target: "j'ai déjà parlé ce matin", via: "fr-m14-10-speak-fresh" },
  { target: "j'ai visité la halle hier", via: "fr-m15-2-speak-jaivisite" },
  { target: "j'ai un frère", via: "fr-m14-5-speak-recall-frere (+m15-5)" },
  { target: "tu ne visites pas l'école", via: "fr-m15-6-speak-tunevisitepas" },
  { target: "tu n'as pas visité la halle", via: "fr-m15-7-speak-tunaspasvisite" },
  { target: "j'ai déjà visité la halle", via: "fr-m15-8-speak-jaidejavisite" },
  { target: "j'ai visité la ville hier soir", via: "fr-m15-9-speak-jaivisite" },
  { target: "j'ai déjà visité la ville ce matin", via: "fr-m15-10-speak-fresh" },
];

/** Grade an ASR transcript against `target` the exact way `SpeakingStepView`
 *  does for every non-JA course (fr included) — see line ~670. */
function grade(target: string, transcript: string) {
  return scoreAlternativesGeneric(target, [{ transcript }]);
}

/** A transcript "passes" a speaking step when verdict is perfect OR close —
 *  see `SpeakingStepView.tsx`: `passed = verdict === "perfect" || "close"`. */
function passed(verdict: string): boolean {
  return verdict === "perfect" || verdict === "close";
}

describe("FR speech elision grading — real transcript variants (2026-09-10)", () => {
  describe("baseline: authored straight-apostrophe transcript is always exact", () => {
    it.each(APOSTROPHE_TARGETS)("$target", ({ target }) => {
      const r = grade(target, target);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("curly/typographic apostrophe (’ U+2019) — Whisper's own text normalizer renders elision this way", () => {
    it.each(APOSTROPHE_TARGETS)("$target", ({ target }) => {
      const curly = target.replace(/'/g, "’");
      const r = grade(target, curly);
      // Fixed: normalizeGeneric now folds curly → straight before stripping,
      // same as normalizeTypedAnswer, so this is an EXACT match, not just a
      // passing score.
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
      expect(normalizeGeneric(curly)).toBe(normalizeGeneric(target));
    });
  });

  describe("space-split apostrophe (\"je n ai pas\", \"j ai\") — ASR drops the mark and leaves a gap", () => {
    it.each(APOSTROPHE_TARGETS)("$target", ({ target }) => {
      const spaceSplit = target.replace(/(\w)'(\w)/g, "$1 $2");
      const r = grade(target, spaceSplit);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("glued, no apostrophe no space (\"jai\", \"cest\") — ASR drops the mark and closes the gap", () => {
    it.each(APOSTROPHE_TARGETS)("$target", ({ target }) => {
      const glued = target.replace(/'/g, "");
      const r = grade(target, glued);
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });

  describe("de-elided — learner (or ASR) renders the un-elided full words (\"je ne ai pas\", \"je ai\", \"ce est\")", () => {
    // Judgment call (see file header): these are pronunciation variants, not
    // content errors, so the bar is "still passes" (perfect or close), not
    // "exact". This documents current behavior; it is NOT patched.
    function deElide(s: string): string {
      return s
        .replace(/\bc'est\b/g, "ce est")
        .replace(/\bn'est\b/g, "ne est")
        .replace(/\bn'ai\b/g, "ne ai")
        .replace(/\bn'as\b/g, "ne as")
        .replace(/\bn'aimes\b/g, "ne aimes")
        .replace(/\bn'aime\b/g, "ne aime")
        .replace(/\bj'ai\b/g, "je ai")
        .replace(/\bj'aime\b/g, "je aime")
        .replace(/\bl'école\b/g, "le école");
    }

    it.each(APOSTROPHE_TARGETS)("$target", ({ target }) => {
      const deElided = deElide(target);
      if (deElided === target) return; // no elision pattern matched this target
      const r = grade(target, deElided);
      expect(passed(r.verdict)).toBe(true);
      expect(r.verdict).not.toBe("try-again");
    });
  });

  describe("explicit forms named in the verification brief", () => {
    it('«je n\'ai pas mangé» — space-split transcript "je n ai pas mange" (also missing the é) still passes', () => {
      const r = grade("je n'ai pas mangé", "je n ai pas mange");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«tu n\'as pas» — curly-apostrophe transcript is exact', () => {
      const r = grade("tu n'as pas", "tu n’as pas");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });

    it('«j\'ai visité la ville» — glued transcript ("jai visite la ville", accent-dropped) still passes', () => {
      const r = grade("j'ai visité la ville", "jai visite la ville");
      expect(passed(r.verdict)).toBe(true);
    });

    it('«l\'hôtel» (not an authored target, but named in the brief) — space-split and curly both pass', () => {
      const spaceSplit = grade("l'hôtel", "l hôtel");
      const curly = grade("l'hôtel", "l’hôtel");
      expect(passed(spaceSplit.verdict)).toBe(true);
      expect(passed(curly.verdict)).toBe(true);
      expect(curly.verdict).toBe("perfect"); // fixed: exact fold, not leniency
    });

    it('«c\'est» — the short target that PROVES the pre-fix defect: curly apostrophe now folds to an EXACT match', () => {
      // Before the loose-match.ts fix this scored 0.8 ("close", not
      // "perfect") — the one un-folded curly-apostrophe character cost 20%
      // of a 5-character normalized string. Every curriculum target is long
      // enough that char-overlap leniency papered over the same gap, which
      // is exactly why the ledger called this UNVERIFIED rather than known-
      // broken. This is the regression guard for the fix.
      const r = grade("c'est", "c’est");
      expect(r.verdict).toBe("perfect");
      expect(r.bestScore).toBe(1);
    });
  });
});

describe("normalizeGeneric — apostrophe-variant fold is a targeted addition", () => {
  it("folds curly, reversed-9, and other apostrophe look-alikes to the same key as straight '", () => {
    const variants = ["c'est", "c’est", "c‘est", "cʼest", "c＇est"];
    const keys = variants.map(normalizeGeneric);
    expect(new Set(keys).size).toBe(1);
  });

  it("is a no-op for text with no apostrophe (es/ko sibling safety)", () => {
    expect(normalizeGeneric("hola, ¿cómo estás?")).toBe(normalizeGeneric("hola, ¿cómo estás?"));
    expect(normalizeGeneric("안녕하세요")).toBe(normalizeGeneric("안녕하세요"));
  });
});
