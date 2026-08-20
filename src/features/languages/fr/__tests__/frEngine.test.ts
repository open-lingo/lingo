/**
 * FR engine contract.
 *
 * The French helper factories exist to make bad steps UNREACHABLE rather than
 * detectable, so the thing worth testing is that each refusal actually
 * refuses. A validator nobody has tripped is a comment.
 *
 * The characteristic French defect is not an ungrammatical step — it is an
 * UNANSWERABLE one: a question whose answer cannot be heard, or a link a
 * French speaker does not pronounce. Those read as correct in review and fail
 * only in a learner's ear, which is why they are caught here, at import time,
 * instead of in QA.
 */
import { describe, it, expect } from "vitest";
import {
  atom,
  elidesBefore,
  isConsonantOnset,
  getFrCourseAtoms,
  findFrAtomBySurface,
} from "../courseAtoms";
import {
  silentLetter,
  liaisonListen,
  agreementChain,
  genderSort,
  aspectChoiceCloze,
} from "../grammarHelpers";
import { frModule } from "../module";
import { getLanguageModule, getAllLanguageIds } from "@/shared/language/registry";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { getTtsManifest } from "@/shared/tts/manifest";

// A handful of atoms so the registry-aware validators have something to read.
// `héros` is the h-aspiré case; `hôtel` is the mute-h case that DOES elide.
const HEROS = atom({
  surface: "héros",
  meaningEn: "hero",
  partOfSpeech: "noun",
  fromModule: "m1",
  kind: "vocab",
  gender: "m",
  hAspire: true,
});
atom({
  surface: "hôtel",
  meaningEn: "hotel",
  partOfSpeech: "noun",
  fromModule: "m1",
  kind: "vocab",
  gender: "m",
});
atom({
  surface: "chaise",
  meaningEn: "chair",
  partOfSpeech: "noun",
  fromModule: "m1",
  kind: "vocab",
  gender: "f",
});
// `yaourt` is the glide class: SPELLED vowel-initial (well, y-initial),
// PRONOUNCED consonant-initial [j] — blocks elision AND liaison, exactly like
// h aspiré, via the generalized `consonantOnset` flag.
atom({
  surface: "yaourt",
  meaningEn: "yogurt",
  partOfSpeech: "noun",
  fromModule: "m1",
  kind: "vocab",
  gender: "m",
  consonantOnset: true,
});
// One sound, three spellings — the written-but-inaudible agreement set. The
// key's spelling is arbitrary (IPA by convention); only equality is tested.
for (const surface of ["parle", "parles", "parlent"] as const) {
  atom({
    surface,
    meaningEn: "speak(s)",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    homophoneKey: "paʁl",
  });
}
for (const surface of ["parlait", "parlaient"] as const) {
  atom({
    surface,
    meaningEn: "spoke / used to speak",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    homophoneKey: "paʁlɛ",
  });
}

describe("fr elision", () => {
  it("elides before a vowel or a mute h, and not before h aspiré", () => {
    expect(elidesBefore({ surface: "ami" })).toBe(true);
    expect(elidesBefore({ surface: "été" })).toBe(true); // accented vowel
    expect(elidesBefore({ surface: "île" })).toBe(true);
    expect(elidesBefore({ surface: "hôtel" })).toBe(true); // h muet
    expect(elidesBefore({ surface: "chaise" })).toBe(false);
    // The one fact that is NOT predictable from spelling, which is exactly
    // why it is declared on the atom rather than computed at each use site.
    expect(elidesBefore(HEROS)).toBe(false);
    expect(elidesBefore({ surface: "héros" })).toBe(true); // undeclared → wrong
  });

  it("elides before the ligatures œ and æ — l'œuf, l'œil", () => {
    // These were FALSE until 2026-08-19: the vowel set had no ligatures, so
    // `le œuf` shipped as the "correct" built form.
    expect(elidesBefore({ surface: "œuf" })).toBe(true);
    expect(elidesBefore({ surface: "œil" })).toBe(true);
    expect(elidesBefore({ surface: "æsthète" })).toBe(true);
  });

  it("does NOT elide before the vowel-spelled consonant-onset class", () => {
    // le yaourt, le yoga, le onze, le huit, la ouate — spelled vowel-initial
    // (or mute-h-lookalike), pronounced consonant-initial. These returned
    // TRUE until 2026-08-19 (`l'yaourt`, `l'onze`). Like h aspiré, the fact
    // is lexical: it is declared once on the atom.
    for (const surface of ["yaourt", "yoga", "onze", "huit", "ouate"]) {
      expect(elidesBefore({ surface, consonantOnset: true })).toBe(false);
    }
    // Undeclared, the spelling default applies — the flag IS the judgment,
    // and it lives in the inventory.
    expect(elidesBefore({ surface: "yaourt" })).toBe(true);
    // The registered atom carries it, so registry-reading callers are safe.
    expect(elidesBefore(findFrAtomBySurface("yaourt")!)).toBe(false);
  });

  it("hAspire folds into isConsonantOnset — ONE source of truth", () => {
    expect(isConsonantOnset({ hAspire: true })).toBe(true);
    expect(isConsonantOnset({ consonantOnset: true })).toBe(true);
    expect(isConsonantOnset({})).toBe(false);
    expect(isConsonantOnset(HEROS)).toBe(true);
  });
});

describe("fr silentLetter", () => {
  const ok = () =>
    silentLetter({
      id: "fr-t-1",
      writtenForm: "petit",
      graphemes: ["p", "e", "t", "i", "t"],
      silentIndices: [4],
      meaningEn: "small",
    });

  it("builds a step and sorts its indices", () => {
    const s = silentLetter({
      id: "fr-t-2",
      writtenForm: "parlent",
      graphemes: ["p", "a", "r", "l", "e", "n", "t"],
      silentIndices: [6, 4, 5],
      meaningEn: "they speak",
    });
    expect(s.silentIndices).toEqual([4, 5, 6]);
    expect(s.audioText).toBe("parlent"); // defaults to the written form
  });

  it("refuses a grapheme split that does not spell the word", () => {
    // Silent in review: the tiles render, and they render the WRONG word.
    expect(() =>
      silentLetter({
        id: "fr-t-3",
        writtenForm: "beaucoup",
        graphemes: ["b", "eau", "c", "ou"], // dropped the final p
        silentIndices: [3],
        meaningEn: "a lot",
      }),
    ).toThrow(/spell "beaucou".*writtenForm is "beaucoup"/);
  });

  it("refuses a silent index that points at a space", () => {
    // The view renders no tile for a space, so this is an answer the learner
    // is physically unable to give.
    expect(() =>
      silentLetter({
        id: "fr-t-4",
        writtenForm: "ils parlent",
        graphemes: ["i", "l", "s", " ", "p", "a", "r", "l", "e", "n", "t"],
        silentIndices: [3],
        meaningEn: "they speak",
      }),
    ).toThrow(/is a space, not a letter/);
  });

  it("refuses an out-of-range or duplicated index", () => {
    expect(() =>
      silentLetter({ ...ok0(), silentIndices: [9] }),
    ).toThrow(/out of range/);
    expect(() =>
      silentLetter({ ...ok0(), silentIndices: [4, 4] }),
    ).toThrow(/duplicate/);
  });

  function ok0() {
    return {
      id: "fr-t-5",
      writtenForm: "petit",
      graphemes: ["p", "e", "t", "i", "t"],
      silentIndices: [4],
      meaningEn: "small",
    };
  }

  it("accepts a legitimate item", () => {
    expect(ok().type).toBe("silent_letter");
  });
});

describe("fr liaisonListen", () => {
  it("builds a step and defaults its audio to the joined phrase", () => {
    // Junction 1 (amis → chantent) stays silent — pin F1 requires every item
    // to carry at least one non-linking junction (see the refusal below).
    const s = liaisonListen({
      id: "fr-l-1",
      words: ["mes", "amis", "chantent"],
      linkedJunctions: [0],
      meaningEn: "my friends sing",
    });
    expect(s.audioText).toBe("mes amis chantent");
    expect(s.linkedJunctions).toEqual([0]);
  });

  it("refuses a liaison INTO an h-aspiré word", () => {
    // «les héros» is pronounced with a break. Marking it as linked teaches a
    // pronunciation that does not exist, and every downstream check passes.
    expect(() =>
      liaisonListen({
        id: "fr-l-2",
        words: ["les", "héros"],
        linkedJunctions: [0],
        meaningEn: "the heroes",
      }),
    ).toThrow(/h aspiré/);
  });

  it("refuses a liaison FROM a vowel-final word", () => {
    // There is no consonant to carry it — this is a category error, not a
    // hard question.
    expect(() =>
      liaisonListen({
        id: "fr-l-3",
        words: ["joli", "ami"],
        linkedJunctions: [0],
        meaningEn: "nice friend",
      }),
    ).toThrow(/no consonant to carry a liaison/);
  });

  it("refuses a junction index that does not exist", () => {
    expect(() =>
      liaisonListen({
        id: "fr-l-4",
        words: ["les", "amis"],
        linkedJunctions: [1], // only junction 0 exists
        meaningEn: "the friends",
      }),
    ).toThrow(/valid range is 0\.\.0/);
  });

  it("refuses a single-word phrase, which has no junction at all", () => {
    expect(() =>
      liaisonListen({
        id: "fr-l-5",
        words: ["amis"],
        linkedJunctions: [],
        meaningEn: "friends",
      }),
    ).toThrow(/at least 2 words/);
  });

  it("refuses a liaison INTO a glide-class word — same gate as h aspiré", () => {
    // «un yaourt» is [œ̃ ja.uʁ], never *[œ̃.nja.uʁ]. The atom's generalized
    // `consonantOnset` flag (not `hAspire`) must block it — proving the
    // validator reads the single source of truth, not the old field.
    expect(() =>
      liaisonListen({
        id: "fr-l-6",
        words: ["un", "yaourt", "frais"],
        linkedJunctions: [0],
        meaningEn: "a fresh yogurt",
      }),
    ).toThrow(/consonant-onset/);
  });

  it("refuses a liaison FROM «et» — categorically forbidden in French", () => {
    // «et» ends in the letter t, so the ends-in-a-consonant test passes it;
    // until 2026-08-19 this authored a liaison French categorically bans.
    expect(() =>
      liaisonListen({
        id: "fr-l-7",
        words: ["et", "un", "café"],
        linkedJunctions: [0],
        meaningEn: "and a coffee",
      }),
    ).toThrow(/categorically forbidden/);
  });

  it("refuses an all-linking item — pin F1 demands ≥1 silent junction", () => {
    // Learners over-apply liaison at least as often as they miss it; an item
    // whose every junction links teaches "link everything".
    expect(() =>
      liaisonListen({
        id: "fr-l-8",
        words: ["les", "anciens", "amis"],
        linkedJunctions: [0, 1],
        meaningEn: "the old friends",
      }),
    ).toThrow(/NON-linking junction/);
  });
});

describe("fr agreementChain", () => {
  const chain = (over: Partial<Parameters<typeof agreementChain>[0]> = {}) =>
    agreementChain({
      id: "fr-a-1",
      head: { surface: "les chaises", meaningEn: "the chairs", featureLabel: "f. pl." },
      tokens: [
        { kind: "fixed", text: "Les chaises" },
        {
          kind: "slot",
          id: "adj",
          options: ["vert", "vertes"],
          correct: "vertes",
          roleLabel: "adjective",
        },
        {
          kind: "slot",
          id: "pp",
          options: ["assis", "assises"],
          correct: "assises",
          roleLabel: "participle",
        },
      ],
      meaningEn: "The green chairs.",
      ...over,
    });

  it("builds a chain", () => {
    expect(chain().type).toBe("agreement_chain");
  });

  it("refuses a chain of one — that is a cloze, not a chain", () => {
    expect(() =>
      chain({
        tokens: [
          { kind: "fixed", text: "Les chaises" },
          {
            kind: "slot",
            id: "adj",
            options: ["vert", "vertes"],
            correct: "vertes",
            roleLabel: "adjective",
          },
        ],
      }),
    ).toThrow(/needs ≥2 slots/);
  });

  it("refuses a slot whose answer is not among its options", () => {
    expect(() =>
      chain({
        tokens: [
          {
            kind: "slot",
            id: "a",
            options: ["vert", "verts"],
            correct: "vertes",
            roleLabel: "adjective",
          },
          {
            kind: "slot",
            id: "b",
            options: ["assis", "assises"],
            correct: "assises",
            roleLabel: "participle",
          },
        ],
      }),
    ).toThrow(/is not among its options/);
  });

  // parle / parles / parlent are ONE sound. Their atoms share a homophoneKey,
  // and an audio-bearing step whose distractor sounds identical to its answer
  // is unanswerable by ear — the characteristic French defect.
  const HOMOPHONE_TOKENS: Parameters<typeof agreementChain>[0]["tokens"] = [
    { kind: "fixed", text: "Ils" },
    {
      kind: "slot",
      id: "v",
      options: ["parle", "parlent"],
      correct: "parlent",
      roleLabel: "verb",
    },
    {
      kind: "slot",
      id: "adj",
      options: ["contents", "content"],
      correct: "contents",
      roleLabel: "adjective",
    },
  ];

  it("refuses an audio-bearing chain whose distractor is homophonous with its answer", () => {
    expect(() =>
      chain({
        head: { surface: "ils", meaningEn: "they", featureLabel: "3rd pl." },
        audioText: "Ils parlent",
        tokens: HOMOPHONE_TOKENS,
        meaningEn: "They speak.",
      }),
    ).toThrow(/homophonous/);
  });

  it("allows the SAME homophone contrast on a written (audio-free) chain", () => {
    // Written-but-inaudible agreement is a skill in its own right — dropping
    // the audio is what makes the parle/parlent contrast answerable, so the
    // guard must gate on audio, not ban the pair outright.
    expect(
      chain({
        head: { surface: "ils", meaningEn: "they", featureLabel: "3rd pl." },
        tokens: HOMOPHONE_TOKENS,
        meaningEn: "They speak.",
      }).type,
    ).toBe("agreement_chain");
  });
});

describe("fr genderSort", () => {
  const BUCKETS = [
    { id: "m", label: "le" },
    { id: "f", label: "la" },
  ] as const;

  const sort = (items: Parameters<typeof genderSort>[0]["items"]) =>
    genderSort({ id: "fr-g-1", buckets: [...BUCKETS] as never, items });

  it("builds a sort", () => {
    expect(
      sort([
        { id: "1", surface: "hôtel", bucketId: "m", meaningEn: "hotel" },
        { id: "2", surface: "chaise", bucketId: "f", meaningEn: "chair" },
      ]).type,
    ).toBe("gender_sort");
  });

  it("refuses an item printed with its article — the article IS the answer", () => {
    expect(() =>
      sort([
        { id: "1", surface: "le livre", bucketId: "m", meaningEn: "book" },
        { id: "2", surface: "chaise", bucketId: "f", meaningEn: "chair" },
      ]),
    ).toThrow(/carries its article/);
  });

  it("refuses an empty bucket — a one-sided sort is not a sort", () => {
    expect(() =>
      sort([
        { id: "1", surface: "hôtel", bucketId: "m", meaningEn: "hotel" },
        { id: "2", surface: "livre", bucketId: "m", meaningEn: "book" },
      ]),
    ).toThrow(/has no items/);
  });

  it("refuses an item that contradicts its own atom's gender", () => {
    // `chaise` is registered feminine. A step sorting it masculine is teaching
    // the opposite of the registry, and one of them is wrong.
    expect(findFrAtomBySurface("chaise")?.gender).toBe("f");
    expect(() =>
      sort([
        { id: "1", surface: "chaise", bucketId: "m", meaningEn: "chair" },
        { id: "2", surface: "hôtel", bucketId: "f", meaningEn: "hotel" },
      ]),
    ).toThrow(/declares gender/);
  });
});

describe("fr aspectChoiceCloze", () => {
  const seg = (id: string, correct: 0 | 1) => ({
    blank: {
      id,
      lemma: "parler",
      options: ["parlait", "a parlé"] as [string, string],
      correctAnswer: (["parlait", "a parlé"] as const)[correct],
      reason: "background scene",
    },
  });

  it("builds a narrative that actually alternates", () => {
    expect(
      aspectChoiceCloze({
        id: "fr-x-1",
        prompt: "Last summer.",
        meaningEn: "…",
        segments: [seg("b1", 0), { text: " puis " }, seg("b2", 1)],
      }).type,
    ).toBe("aspect_choice_cloze");
  });

  it("refuses a narrative where every blank takes the same option slot", () => {
    // Then the learner is spotting a pattern, not making an aspect decision.
    expect(() =>
      aspectChoiceCloze({
        id: "fr-x-2",
        prompt: "…",
        meaningEn: "…",
        segments: [seg("b1", 0), { text: " et " }, seg("b2", 0)],
      }),
    ).toThrow(/never contrasts/);
  });

  it("refuses a blank with no reason — the reason is the teaching payload", () => {
    const bad = seg("b2", 1);
    bad.blank.reason = "";
    expect(() =>
      aspectChoiceCloze({
        id: "fr-x-3",
        prompt: "…",
        meaningEn: "…",
        segments: [seg("b1", 0), bad],
      }),
    ).toThrow(/no reason/);
  });

  it("refuses a single-blank narrative — one choice is not a contrast", () => {
    expect(() =>
      aspectChoiceCloze({
        id: "fr-x-4",
        prompt: "…",
        meaningEn: "…",
        segments: [seg("b1", 0)],
      }),
    ).toThrow(/needs ≥2 blanks/);
  });

  // parlait / parlaient are one sound [paʁ.lɛ] — their atoms share a
  // homophoneKey (registered at the top of this file).
  const homophoneSegments = (): Parameters<
    typeof aspectChoiceCloze
  >[0]["segments"] => [
    {
      blank: {
        id: "b1",
        lemma: "parler",
        options: ["parlait", "parlaient"] as [string, string],
        correctAnswer: "parlait",
        reason: "background scene",
      },
    },
    { text: " puis " },
    seg("b2", 1),
  ];

  it("refuses an audio-bearing narrative whose blank offers two homophones", () => {
    expect(() =>
      aspectChoiceCloze({
        id: "fr-x-5",
        prompt: "…",
        meaningEn: "…",
        audioText: "Il parlait, puis il a parlé.",
        segments: homophoneSegments(),
      }),
    ).toThrow(/homophonous/);
  });

  it("allows the SAME homophone blank when the step carries no audio", () => {
    expect(
      aspectChoiceCloze({
        id: "fr-x-6",
        prompt: "…",
        meaningEn: "…",
        segments: homophoneSegments(),
      }).type,
    ).toBe("aspect_choice_cloze");
  });
});

describe("fr module registration", () => {
  it("is registered and satisfies the LanguageModule contract", () => {
    expect(getAllLanguageIds()).toContain("fr");
    expect(getLanguageModule("fr")).toBe(frModule);
    expect(frModule.displayName.native).toBe("Français");
  });

  it("is NOT selectable — Denise voice awaits Spencer's audition (fr pin §7 item 6)", () => {
    // The gate is deliberate, and it is the one that must not drift. Until
    // 2026-08-19 the blocker was "no fr audio exists"; m1's clips + manifest
    // landed that day (frAudioCoverage is green at ratchet 0), so the
    // remaining blocker is HUMAN: the fr-FR-DeniseNeural course voice has
    // not been auditioned, and the course is one module deep. Flipping this
    // is Spencer's call, made by adding "fr" to
    // AVAILABLE_LEARNING_LANGUAGE_IDS — then update this pin, don't delete
    // it: selectability should always name what gated it.
    expect(AVAILABLE_LEARNING_LANGUAGE_IDS).not.toContain("fr");
    // `count`, not `hashes.size` — `hashes` is a packed STRING, so `.size` is
    // undefined on every manifest and `?? 0` would make this pass vacuously.
    expect(frModule.ttsManifest.count).toBeGreaterThan(0);
    expect(getTtsManifest("es").count).toBeGreaterThan(0);
  });

  it("omits conjugation rather than declaring it empty", () => {
    // null = "no such capability, route around me"; empty = "capability
    // present, no data", which renders an empty trainer.
    expect(frModule.conjugation).toBeUndefined();
  });

  it("derives its atoms from the curriculum glob, in module order", () => {
    // Deliberately NOT `toBe(0)`. Asserting emptiness would fail the day the
    // first module is authored, which is a test that punishes progress — the
    // invariant is the ORDERING, which must hold at every size. Empty today.
    const atoms = getFrCourseAtoms();
    expect(Array.isArray(atoms)).toBe(true);
    const moduleNos = atoms.map((a) => Number(String(a.fromModule).slice(1)));
    expect([...moduleNos].sort((x, y) => x - y)).toEqual(moduleNos);
  });
});
