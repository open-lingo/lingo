/**
 * Preloaded accepted readings (TestFlight #171).
 *
 * The contract these tests pin is narrow and load-bearing: the set is built
 * SYNCHRONOUSLY at mount from data the step already carries, it contains every
 * spelling of the target a learner could legitimately produce, and it contains
 * nothing else — an accepted set that drifts wider than the target is worse
 * than no early accept at all, because it passes the learner for saying the
 * wrong word and does it faster.
 */
import { describe, expect, it } from "vitest";
import {
  boundedEditDistance,
  buildAcceptedForms,
  expandChoonpu,
  interimEditBudget,
  longVowelVariants,
  matchAcceptedAlternatives,
  matchAcceptedForm,
} from "./acceptedForms";

describe("expandChoonpu", () => {
  it("resolves ー to the vowel of the preceding mora", () => {
    expect(expandChoonpu("こーひー")).toBe("こおひい");
    expect(expandChoonpu("てれびー")).toBe("てれびい");
    expect(expandChoonpu("きょーと")).toBe("きょおと");
  });

  it("leaves strings without ー untouched", () => {
    expect(expandChoonpu("てれび")).toBe("てれび");
    expect(expandChoonpu("")).toBe("");
  });
});

describe("longVowelVariants", () => {
  it("offers both spellings of a long o and a long e", () => {
    expect(longVowelVariants("とうきょう")).toContain("とおきょお");
    expect(longVowelVariants("せんせい")).toContain("せんせえ");
  });

  it("always includes the input itself", () => {
    expect(longVowelVariants("みず")).toEqual(["みず"]);
  });
});

describe("buildAcceptedForms — Japanese", () => {
  it("accepts the katakana surface, its kana fold, and a romaji rendering", () => {
    const forms = buildAcceptedForms({ target: "テレビ", lang: "ja" });

    // The exact case from the #171 screenshot: the card prints テレビ and the
    // recognizer returned てれび.
    expect(matchAcceptedForm("テレビ", forms)).not.toBeNull();
    expect(matchAcceptedForm("てれび", forms)).not.toBeNull();
    // Chrome/Whisper hand back pure ASCII on short JA utterances.
    expect(matchAcceptedForm("terebi", forms)).not.toBeNull();
  });

  it("accepts the kana reading of a kanji target, and the kanji itself", () => {
    // What a JA speaking step actually carries: `targetAnnotation` segments
    // whose `reading` is the kana for a kanji surface (#165's 店がしまる).
    const forms = buildAcceptedForms({
      target: "店がしまる",
      lang: "ja",
      readings: ["みせがしまる"],
    });

    expect(matchAcceptedForm("みせがしまる", forms)).not.toBeNull();
    // On-device iOS JA transcribes in natural orthography — kanji included —
    // and that must match WITHOUT waiting on the async kuroshiro conversion.
    expect(matchAcceptedForm("店がしまる", forms)).not.toBeNull();
  });

  it("is insensitive to punctuation and spacing the recognizer adds", () => {
    const forms = buildAcceptedForms({
      target: "こんにちは",
      lang: "ja",
      readings: ["こんにちは"],
    });
    expect(matchAcceptedForm("こんにちは。", forms)).not.toBeNull();
    expect(matchAcceptedForm(" こんにちは ", forms)).not.toBeNull();
  });

  it("folds 長音 so コーヒー and こうひい are the same word", () => {
    const forms = buildAcceptedForms({ target: "コーヒー", lang: "ja" });
    expect(matchAcceptedForm("こーひー", forms)).not.toBeNull();
    expect(matchAcceptedForm("こおひい", forms)).not.toBeNull();
    // おう is the ordinary spelling of a long /o:/ and the variant generator
    // has to reach it from the doubled form.
    const tokyo = buildAcceptedForms({ target: "とうきょう", lang: "ja" });
    expect(matchAcceptedForm("とおきょお", tokyo)).not.toBeNull();
  });

  it("takes author-listed alternates", () => {
    const forms = buildAcceptedForms({
      target: "これをください",
      lang: "ja",
      alsoAccepted: ["これください"],
    });
    expect(matchAcceptedForm("これください", forms)).not.toBeNull();
  });

  it("rejects a different word, and rejects a fragment of the target", () => {
    const forms = buildAcceptedForms({ target: "テレビ", lang: "ja" });
    expect(matchAcceptedForm("ラジオ", forms)).toBeNull();
    expect(matchAcceptedForm("て", forms)).toBeNull();
    expect(matchAcceptedForm("", forms)).toBeNull();
  });

  it("holds a short target to an exact match — かき is not かぎ", () => {
    const forms = buildAcceptedForms({ target: "かき", lang: "ja" });
    expect(forms.editBudget).toBe(0);
    expect(matchAcceptedForm("かぎ", forms)).toBeNull();
    expect(matchAcceptedForm("かき", forms)).not.toBeNull();
  });

  it("tolerates one edit on a long phrase", () => {
    const forms = buildAcceptedForms({
      target: "まいあさコーヒーをのみます",
      lang: "ja",
      readings: ["まいあさこうひいをのみます"],
    });
    expect(forms.editBudget).toBeGreaterThanOrEqual(1);
    // One substituted mora out of twelve is a recognizer slip, not a
    // different sentence.
    expect(matchAcceptedForm("まいあさこうひいをのみません", forms)).toBeNull();
    expect(matchAcceptedForm("まいあさこうひいをのみまず", forms)).not.toBeNull();
  });
});

describe("buildAcceptedForms — non-Japanese courses", () => {
  it("matches Korean through the generic normalizer", () => {
    const forms = buildAcceptedForms({ target: "안녕하세요", lang: "ko" });
    expect(matchAcceptedForm("안녕하세요", forms)).not.toBeNull();
    expect(matchAcceptedForm("안녕하세요.", forms)).not.toBeNull();
    expect(matchAcceptedForm("감사합니다", forms)).toBeNull();
  });

  it("matches Spanish case- and punctuation-insensitively", () => {
    const forms = buildAcceptedForms({
      target: "¿Dónde está el baño?",
      lang: "es",
      alsoAccepted: ["dónde está el baño"],
    });
    expect(matchAcceptedForm("dónde está el baño", forms)).not.toBeNull();
    expect(matchAcceptedForm("Dónde está el baño?", forms)).not.toBeNull();
  });

  it("matches French elision written with a typographic apostrophe", () => {
    const forms = buildAcceptedForms({ target: "j'ai faim", lang: "fr" });
    expect(matchAcceptedForm("j\u2019ai faim", forms)).not.toBeNull();
  });

  it("never applies kana machinery to a non-JA target", () => {
    const forms = buildAcceptedForms({ target: "hola", lang: "es" });
    expect(forms.contextual).toEqual(["hola"]);
  });
});

describe("contextualStrings payload", () => {
  it("leads with the target and carries every accepted surface", () => {
    const forms = buildAcceptedForms({
      target: "テレビ",
      lang: "ja",
      readings: ["てれび"],
      alsoAccepted: ["テレビです"],
    });
    expect(forms.contextual[0]).toBe("テレビ");
    expect(forms.contextual).toContain("てれび");
    expect(forms.contextual).toContain("テレビです");
  });

  it("carries no duplicates and stays short enough to bias, not dilute", () => {
    const forms = buildAcceptedForms({
      target: "テレビ",
      lang: "ja",
      readings: ["テレビ", "テレビ"],
    });
    expect(new Set(forms.contextual).size).toBe(forms.contextual.length);
    expect(forms.contextual.length).toBeLessThanOrEqual(12);
  });
});

describe("edit budget + distance", () => {
  it("gives short targets no slack at all", () => {
    expect(interimEditBudget(2, 0.85)).toBe(0);
    expect(interimEditBudget(3, 0.85)).toBe(0);
    expect(interimEditBudget(4, 0.85)).toBe(1);
  });

  it("scales with the perfect dial and caps at two", () => {
    expect(interimEditBudget(40, 0.85)).toBe(2);
    expect(interimEditBudget(10, 0.95)).toBe(1);
  });

  it("bails out instead of scoring beyond the budget", () => {
    expect(boundedEditDistance("abc", "abc", 1)).toBe(0);
    expect(boundedEditDistance("abc", "abd", 1)).toBe(1);
    expect(boundedEditDistance("abc", "xyz", 1)).toBe(Infinity);
    expect(boundedEditDistance("abc", "abd", 0)).toBe(Infinity);
  });
});

describe("matchAcceptedAlternatives", () => {
  it("finds the accepted form anywhere in the N-best list", () => {
    const forms = buildAcceptedForms({ target: "テレビ", lang: "ja" });
    const hit = matchAcceptedAlternatives(
      [{ transcript: "手ぇ、ビー" }, { transcript: "でれび" }, { transcript: "てれび" }],
      forms,
    );
    expect(hit?.transcript).toBe("てれび");
    expect(hit?.match.distance).toBe(0);
  });

  it("returns null when nothing in the list is the target", () => {
    const forms = buildAcceptedForms({ target: "テレビ", lang: "ja" });
    expect(
      matchAcceptedAlternatives([{ transcript: "ラジオ" }, { transcript: "でんわ" }], forms),
    ).toBeNull();
  });
});
