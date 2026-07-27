import { describe, expect, it } from "vitest";
import {
  applyKanjiSurfaces,
  KANJI_ELIGIBLE_ATOMS,
} from "./applyKanjiSurfaces";
import {
  KANJI_RECOGNITION_MODULE,
  FURIGANA_WINDOW,
  furiganaVisibleAt,
} from "./kanjiRollout";
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import { getTtsUrl } from "@/shared/tts";
import { JA_COURSE_ATOMS_BY_ID } from "@/features/languages/ja/courseAtoms";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { vocabMcq, build, type ReviewAtom } from "@/features/languages/ja/grammarHelpers";

/**
 * KANJI SURFACE POST-PASS — the owner's "needs good checks to make sure it
 * works right" suite. Enforces the four invariants from the spec §3/§4 plus
 * the owner's LIVE furigana-window + reviews policy (./kanjiRollout.ts):
 *
 *   4a property — zero divergence of audio/grading fields pre/post pass
 *   4c content-gate — no kanji anywhere below the m8 recognition floor
 *   window — m8 kanji show furigana in m8/m9, none in m10+
 *   TTS — every substituted surface's audio key still resolves in the manifest
 *   reviews — an m10 review of m8 vocab shows kanji WITHOUT furigana (deliv #3)
 */

const HAS_HAN = /\p{Script=Han}/u;
const isKana = (c: string) => /[ぁ-ヿ]/u.test(c);

function moduleNum(id: string, moduleId: string): number {
  const m = /^m(\d+)$/.exec(moduleId);
  if (m) return parseInt(m[1], 10);
  const j = /^(?:ja|ko)-m(\d+)(?:[-]|$)/.exec(id);
  return j ? parseInt(j[1], 10) : 0;
}

type Seg = JapaneseAnnotation & Record<string, unknown>;

/** Every annotation segment in a lesson, tagged with the field key it sat under. */
function collectSegments(lesson: LessonContent): { seg: Seg; key: string }[] {
  const out: { seg: Seg; key: string }[] = [];
  const visit = (v: unknown, key: string): void => {
    if (Array.isArray(v)) return void v.forEach((e) => visit(e, key));
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.surface === "string" && typeof o.reading === "string") {
        out.push({ seg: o as Seg, key });
      }
      for (const k of Object.keys(o)) visit(o[k], k);
    }
  };
  visit(lesson.steps, "root");
  return out;
}

/** Multiset of every annotation atomId in the lesson (order-independent). */
function atomIdMultiset(lesson: LessonContent): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { seg } of collectSegments(lesson)) {
    if (typeof seg.atomId === "string") {
      counts[seg.atomId] = (counts[seg.atomId] ?? 0) + 1;
    }
  }
  return counts;
}

/** Deep clone with every `*Annotation` field blanked — what's LEFT must be
 *  byte-identical pre/post pass (proves the pass edits only display fields). */
function withoutAnnotations(lesson: LessonContent): unknown {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>)) {
        // Blank every annotation display field — both the singular
        // "*Annotation" (a single array) and the plural "*Annotations"
        // (a list of arrays, e.g. optionAnnotations). Mirrors the pass's
        // isAnnotationKey so option-surface substitutions are excluded from
        // the audio/grading equality check.
        out[k] =
          k.endsWith("Annotation") || k.endsWith("Annotations")
            ? null
            : strip((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return v;
  };
  return strip(lesson);
}

/**
 * Reconstruct the pre-pass ("pure kana") lesson from a substituted one:
 * every eligible Han surface reverts to its atom's kana (surface === reading).
 * Faithful because the pass is the ONLY producer of kanji surfaces (no author
 * sets surface≠kana), and every substituted seg carries its atomId.
 */
function revertToKana(lesson: LessonContent): LessonContent {
  const revert = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(revert);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (
        typeof o.surface === "string" &&
        typeof o.reading === "string" &&
        HAS_HAN.test(o.surface) &&
        typeof o.atomId === "string" &&
        KANJI_ELIGIBLE_ATOMS.has(o.atomId)
      ) {
        const kana = JA_COURSE_ATOMS_BY_ID.get(o.atomId)?.kana;
        if (kana) {
          // Drop the pass-stamped window flag too — the pre-pass shape
          // never carries it.
          const { furiganaWindowOpen: _omit, ...rest } = o;
          return { ...rest, surface: kana, reading: kana };
        }
      }
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o)) out[k] = revert(o[k]);
      return out;
    }
    return v;
  };
  return revert(lesson) as LessonContent;
}

const JA_LESSON_IDS = getAvailableMockLessonIds().filter((id) =>
  id.startsWith("ja-"),
);

// ── Synthetic lesson factories (precise, deterministic control of module) ──

function synthLesson(moduleId: string, steps: LessonStep[]): LessonContent {
  return {
    id: `ja-${moduleId}-synthetic`,
    moduleId,
    courseId: "mock-1",
    languageId: "ja",
    title: "synthetic",
    steps,
  };
}

/** A match_pairs step whose single source is one atom's kana annotation. */
function matchStep(atomId: string): LessonStep {
  const atom = JA_COURSE_ATOMS_BY_ID.get(atomId)!;
  return {
    id: `synth-match-${atomId}`,
    type: "match_pairs",
    prompt: "match",
    pairs: [
      {
        id: "p1",
        source: atom.kana,
        target: atom.meaningEn,
        sourceAnnotation: [
          { surface: atom.kana, reading: atom.kana, atomId },
        ],
      },
    ],
  };
}

// ───────────────────────────── eligibility map ─────────────────────────────

describe("KANJI_ELIGIBLE_ATOMS", () => {
  it("is non-empty and every unlock module is at/above the m8 floor", () => {
    expect(KANJI_ELIGIBLE_ATOMS.size).toBeGreaterThan(0);
    for (const [, entry] of KANJI_ELIGIBLE_ATOMS) {
      expect(entry.unlockModule).toBeGreaterThanOrEqual(KANJI_RECOGNITION_MODULE);
      expect(HAS_HAN.test(entry.kanji)).toBe(true);
    }
  });

  it("gates multi-kanji words on the MAX of component unlock modules", () => {
    // 電車 (densha): 電 and 車 both taught at m22 → unlock 22 (not an earlier
    // MIN). 学校 (gakkou): 学 m11 + 校 m22 → 22. Proves the MAX-of-components gate.
    expect(KANJI_ELIGIBLE_ATOMS.get("densha")?.unlockModule).toBe(22);
    expect(KANJI_ELIGIBLE_ATOMS.get("ja-m6-1-gakkou")?.unlockModule).toBe(22);
    // 今日 (kyou): both 今 + 日 at m10 → unlock 10.
    expect(KANJI_ELIGIBLE_ATOMS.get("kyou")?.unlockModule).toBe(10);
  });

  it("excludes words whose component kanji are not yet in the catalog", () => {
    // 時計 (tokei) needs 計 and 友達 (tomodachi) needs 達 — neither glyph is
    // N5, so neither has an N5_KANJI entry → not eligible even though both
    // atoms sit in an entry's anchorVocab (時 / 友). They stay kana until a
    // natively-reviewed catalog extension makes those glyphs teachable.
    expect(KANJI_ELIGIBLE_ATOMS.has("tokei")).toBe(false);
    expect(KANJI_ELIGIBLE_ATOMS.has("ja-m3-3-v-tomodachi")).toBe(false);
  });

  it("m23–27 backfill (2026-07-18) unblocks the former catalog-gap words", () => {
    // 本 lands at m23 → 日本人 gates on MAX(日 m10, 本 m23, 人 m11) = 23.
    // This was the pinned casualty of the gap (Spencer's m29 QA walk):
    // formerly `has("ja-m3-2-v-nihonjin") === false`.
    expect(KANJI_ELIGIBLE_ATOMS.get("ja-m3-2-v-nihonjin")?.unlockModule).toBe(23);
    expect(KANJI_ELIGIBLE_ATOMS.get("nihon")?.unlockModule).toBe(23);
    expect(KANJI_ELIGIBLE_ATOMS.get("ja-m3-3-v-hon")?.unlockModule).toBe(23);
    // 話 (m23) + already-taught 電 (m22) → 電話 at 23.
    expect(KANJI_ELIGIBLE_ATOMS.get("denwa")?.unlockModule).toBe(23);
    // 間 (m24) + 時 (m12) → 時間 at 24; 週 (m24) + 先 (m10) → 先週 at 24.
    expect(KANJI_ELIGIBLE_ATOMS.get("jikan")?.unlockModule).toBe(24);
    expect(KANJI_ELIGIBLE_ATOMS.get("senshuu")?.unlockModule).toBe(24);
    // 会/社 land together at m25 — the module that teaches 会う (au).
    expect(KANJI_ELIGIBLE_ATOMS.get("au")?.unlockModule).toBe(25);
    expect(KANJI_ELIGIBLE_ATOMS.get("kaisha")?.unlockModule).toBe(25);
    // Quantity/degree adjectives at m26; 空 rounds out nature at m27.
    expect(KANJI_ELIGIBLE_ATOMS.get("sukoshi")?.unlockModule).toBe(26);
    expect(KANJI_ELIGIBLE_ATOMS.get("sora")?.unlockModule).toBe(27);
  });

  it("skips the polite -ます forms (no stored kanji — v1.1 will derive them)", () => {
    for (const id of ["tabemasu", "nomimasu", "mimasu", "yomimasu", "kakimasu", "ikimasu"]) {
      expect(KANJI_ELIGIBLE_ATOMS.has(id)).toBe(false);
    }
  });
});

// ─────────────────────────── window arithmetic ────────────────────────────

describe("furigana window arithmetic", () => {
  it("keeps furigana for the unlock module and the next, then drops it", () => {
    expect(FURIGANA_WINDOW).toBe(2);
    expect(furiganaVisibleAt(8, 8)).toBe(true); // unlock module
    expect(furiganaVisibleAt(9, 8)).toBe(true); // unlock + 1
    expect(furiganaVisibleAt(10, 8)).toBe(false); // unlock + 2 → off
    expect(furiganaVisibleAt(10, 9)).toBe(true); // m9 kanji still in window at m10
    expect(furiganaVisibleAt(11, 9)).toBe(false);
  });
});

// ───────────── word_image_mcq option annotations feed the pass ─────────────

describe("vocabMcq optionAnnotations route options through the kanji pass", () => {
  const POOL: ReviewAtom[] = [
    { kana: "がっこう", meaningEn: "school",   emoji: "🏫", fromModule: "m6" },
    { kana: "ねこ",     meaningEn: "cat",      emoji: "🐱", fromModule: "m1" },
    { kana: "いぬ",     meaningEn: "dog",      emoji: "🐕", fromModule: "m1" },
    { kana: "やま",     meaningEn: "mountain", emoji: "⛰️", fromModule: "m1" },
    { kana: "かわ",     meaningEn: "river",    emoji: "🏞️", fromModule: "m1" },
  ];
  const target = POOL[0]; // がっこう → atom ja-m6-1-gakkou, kanji 学校, unlock m22

  it("attaches a single-atom annotation (with atomId) per option, parallel to options", () => {
    const step = vocabMcq("mcq-gakkou", target, POOL);
    expect(step.optionAnnotations).toBeDefined();
    expect(step.optionAnnotations!).toHaveLength(step.options.length);
    // The がっこう option's annotation carries the resolvable atomId — the hook
    // the pass keys on. Option id/word (audio + grading) stay pure kana.
    const gi = step.options.findIndex((o) => o.word === "がっこう");
    const ann = step.optionAnnotations![gi]!;
    expect(ann).toHaveLength(1);
    expect(ann[0].surface).toBe("がっこう");
    expect(ann[0].reading).toBe("がっこう");
    expect(ann[0].atomId).toBe("ja-m6-1-gakkou");
    expect(step.options[gi].word).toBe("がっこう"); // unchanged answer/audio key
  });

  it("after applyKanjiSurfaces at m24 (past unlock+2), the option surface is 学校 with the kana reading kept and the window flagged closed", () => {
    const step = vocabMcq("mcq-gakkou", target, POOL);
    const out = applyKanjiSurfaces(synthLesson("m24", [step]));
    const gi = step.options.findIndex((o) => o.word === "がっこう");
    const wordStep = out.steps[0] as typeof step;
    const ann = wordStep.optionAnnotations![gi]!;
    expect(ann[0].surface).toBe("学校"); // kanji substituted
    // 2026-07-17: the kana reading is ALWAYS carried — the renderer decides
    // visibility (window floor OR unmastered). Past the window the flag is
    // false, so furigana shows only while the atom is not FSRS-mastered.
    expect(ann[0].reading).toBe("がっこう");
    expect(ann[0].furiganaWindowOpen).toBe(false);
    // Grading/audio untouched: the option word is still kana.
    expect(wordStep.options[gi].word).toBe("がっこう");
    expect(wordStep.correctOptionId).toBe(step.correctOptionId);
  });

  it("leaves options as kana below the unlock module", () => {
    const step = vocabMcq("mcq-gakkou", target, POOL);
    const out = applyKanjiSurfaces(synthLesson("m10", [step]));
    const gi = step.options.findIndex((o) => o.word === "がっこう");
    const ann = (out.steps[0] as typeof step).optionAnnotations![gi]!;
    expect(ann[0].surface).toBe("がっこう"); // m10 < unlock 22 → stays kana
  });
});

// ─────────────────── 4a: property — zero audio/grading divergence ──────────

describe("property: pass edits ONLY *Annotation display fields (§4a)", () => {
  it("every JA lesson: audio/grading fields + atom multiset identical pre/post", () => {
    let lessonsThatSubstituted = 0;
    for (const id of JA_LESSON_IDS) {
      const post = getMockLessonContent(id);
      if (!post || post.languageId !== "ja") continue;
      const pre = revertToKana(post);
      const post2 = applyKanjiSurfaces(pre);

      // Everything OUTSIDE *Annotation fields is byte-identical — this single
      // assertion covers audioKey / audioText / targetPhrase / promptAudioText
      // / tiles / correctOrder / acceptedAnswers / pair.id / option ids /
      // correctOptionId and every other non-display field at once.
      expect(withoutAnnotations(post2)).toEqual(withoutAnnotations(pre));

      // No atom added, removed, or renumbered by the pass.
      expect(atomIdMultiset(post2)).toEqual(atomIdMultiset(pre));

      if (collectSegments(post2).some((s) => HAS_HAN.test(s.seg.surface))) {
        lessonsThatSubstituted++;
      }
    }
    // Guard against a vacuous pass (e.g. eligibility silently empty).
    expect(lessonsThatSubstituted).toBeGreaterThan(0);
  });

  it("explicitly deep-equals the named audio + grading fields pre/post", () => {
    const AUDIO_GRADING = new Set([
      "audioKey",
      "audioText",
      "targetPhrase",
      "promptAudioText",
      "tiles",
      "correctOrder",
      "acceptedAnswers",
      "correctOptionId",
      "correctParticle",
    ]);
    const collect = (lesson: LessonContent): unknown[] => {
      const out: unknown[] = [];
      const visit = (v: unknown, key: string): void => {
        if (AUDIO_GRADING.has(key)) out.push([key, v]);
        if (Array.isArray(v)) return void v.forEach((e) => visit(e, key));
        if (v && typeof v === "object") {
          for (const k of Object.keys(v as Record<string, unknown>)) {
            visit((v as Record<string, unknown>)[k], k);
          }
        }
      };
      visit(lesson.steps, "root");
      return out;
    };
    for (const id of JA_LESSON_IDS) {
      const post = getMockLessonContent(id);
      if (!post || post.languageId !== "ja") continue;
      const pre = revertToKana(post);
      expect(collect(applyKanjiSurfaces(pre))).toEqual(collect(pre));
    }
  });
});

// ─────────────────────── 4c: content gate (m1‑7 floor) ─────────────────────

describe("content gate: zero kanji below the m8 recognition floor (§4c)", () => {
  it("no lesson at module < 8 has any kanji annotation surface", () => {
    const offenders: string[] = [];
    for (const id of JA_LESSON_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson || lesson.languageId !== "ja") continue;
      const mod = moduleNum(lesson.id, lesson.moduleId);
      if (mod >= KANJI_RECOGNITION_MODULE) continue;
      for (const { seg } of collectSegments(lesson)) {
        if (HAS_HAN.test(seg.surface)) {
          offenders.push(`${id}(m${mod}): ${seg.surface}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("m1‑m7 stay kana even when a substitutable atom appears", () => {
    // いち (ja-m5-1-v-1) is eligible at m8; an m7 lesson using it must NOT kanji.
    const lesson = synthLesson("m7", [matchStep("ja-m5-1-v-1")]);
    const out = applyKanjiSurfaces(lesson);
    const seg = collectSegments(out)[0].seg;
    expect(seg.surface).toBe("いち");
    expect(HAS_HAN.test(seg.surface)).toBe(false);
    // reference-identity no-op below the floor
    expect(out).toBe(lesson);
  });
});

// ───────────────────────── furigana window on lessons ──────────────────────

describe("furigana window flag: open in m8/m9 for m8 kanji, closed from m10 — kana reading ALWAYS carried", () => {
  it("m8: number kanji substituted with the window open (kana reading, flag true)", () => {
    const out = applyKanjiSurfaces(synthLesson("m8", [matchStep("ja-m5-1-v-1")]));
    const seg = collectSegments(out)[0].seg;
    expect(seg.surface).toBe("一");
    expect(seg.reading).toBe("いち"); // kana furigana carried
    expect(seg.surface).not.toBe(seg.reading);
    expect(Array.from(seg.reading).every(isKana)).toBe(true);
    expect(seg.furiganaWindowOpen).toBe(true);
  });

  it("m9: m8-unlocked kanji still inside the window (flag true)", () => {
    const out = applyKanjiSurfaces(synthLesson("m9", [matchStep("ja-m5-1-v-2")]));
    const seg = collectSegments(out)[0].seg;
    expect(seg.surface).toBe("二");
    expect(seg.reading).toBe("に");
    expect(seg.furiganaWindowOpen).toBe(true);
  });

  it("m10: m8-unlocked kanji past the window — flag false but the kana reading is KEPT (renderer shows it until FSRS mastery)", () => {
    const out = applyKanjiSurfaces(synthLesson("m10", [matchStep("ja-m5-1-v-3")]));
    const seg = collectSegments(out)[0].seg;
    expect(seg.surface).toBe("三");
    // 2026-07-17 ruling: the data never destroys the furigana — past the
    // window, visibility hands over to the SRS gate in AnnotatedText.
    expect(seg.reading).toBe("さん");
    expect(Array.from(seg.reading).every(isKana)).toBe(true);
    expect(seg.furiganaWindowOpen).toBe(false);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: this asserts behaviour for a
    // module that no longer exists in the course (it ends at m7). Re-enable
    // as each module is authored — do not delete, the behaviour is real.
    it.skip("real m8/m9 lessons carry window-open kanji; m10 lessons carry window-closed", () => {
    const hasWindowedKanji = (id: string, wantOpen: boolean): boolean => {
      const lesson = getMockLessonContent(id);
      if (!lesson) return false;
      return collectSegments(lesson).some(({ seg }) => {
        if (!HAS_HAN.test(seg.surface)) return false;
        // Every substituted segment keeps its kana reading now.
        if (seg.surface === seg.reading) return false;
        // restrict to m8-unlocked (number) atoms so the window is deterministic
        const isM8Atom =
          typeof seg.atomId === "string" &&
          KANJI_ELIGIBLE_ATOMS.get(seg.atomId)?.unlockModule === 8;
        return isM8Atom && seg.furiganaWindowOpen === wantOpen;
      });
    };
    // At least one m8 and one m9 lesson show an m8-kanji inside the window …
    expect(JA_LESSON_IDS.filter((i) => /^ja-m8-/.test(i)).some((i) => hasWindowedKanji(i, true))).toBe(true);
    expect(JA_LESSON_IDS.filter((i) => /^ja-m9-/.test(i)).some((i) => hasWindowedKanji(i, true))).toBe(true);
    // … and at least one m10 lesson shows an m8-kanji with the window closed.
    expect(JA_LESSON_IDS.filter((i) => /^ja-m10-/.test(i)).some((i) => hasWindowedKanji(i, false))).toBe(true);
  });
});

// ─────────────────────────── TTS still resolves ────────────────────────────

describe("TTS: every substituted surface's audio key still resolves", () => {
  it("the atom kana behind each kanji surface has a manifest entry", () => {
    const misses = new Set<string>();
    for (const id of JA_LESSON_IDS) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const { seg } of collectSegments(lesson)) {
        if (!HAS_HAN.test(seg.surface)) continue;
        const kana =
          typeof seg.atomId === "string"
            ? JA_COURSE_ATOMS_BY_ID.get(seg.atomId)?.kana
            : undefined;
        if (kana && getTtsUrl(kana, "ja") === null) misses.add(`${seg.atomId}(${kana})`);
      }
    }
    expect([...misses]).toEqual([]);
  });
});

// ───────────────── deliverable #3: kanji-mode reviews (m10 of m8/m9) ────────

describe("reviews bake in m8 & m9 production (deliverable #3)", () => {
  it("an m10 review flags m8 vocab past the window, m9 vocab inside it (readings kept on both)", () => {
    // A review lesson's moduleId is where the learner is. Model an m10 review
    // touching an m8 atom (一) and an m9 atom (大きい).
    const lesson = synthLesson("m10", [
      matchStep("ja-m5-1-v-1"), // 一, unlock m8 → window m8‑m9 → closed at m10
      matchStep("ookii"), //        大きい, unlock m9 → window m9‑m10 → open at m10
    ]);
    const out = applyKanjiSurfaces(lesson);
    const segs = collectSegments(out);
    const ichi = segs.find((s) => s.seg.atomId === "ja-m5-1-v-1")!.seg;
    const ookii = segs.find((s) => s.seg.atomId === "ookii")!.seg;
    expect(ichi.surface).toBe("一");
    expect(ichi.reading).toBe("いち"); // reading kept; SRS gate decides
    expect(ichi.furiganaWindowOpen).toBe(false); // past window
    expect(ookii.surface).toBe("大きい");
    expect(ookii.reading).toBe("おおきい");
    expect(ookii.furiganaWindowOpen).toBe(true); // still in window
  });

  it("the SRS review path is wired through the pass without error", () => {
    // In a fresh test env nothing is SRS-unlocked, so this returns the
    // "nothing to review" stub — the point is the review branch of
    // getMockLessonContent routes through applyKanjiSurfaces and never throws.
    expect(() => getMockLessonContent("ja-m10-review-1")).not.toThrow();
    expect(getMockLessonContent("ja-m10-review-1")?.languageId).toBe("ja");
  });
});

// ───────── sentence-level kanji: multi-segment targets, per-word gating ──────

describe("sentence-level kanji substitution (multi-segment annotations)", () => {
  const SENTENCE = "まいにち ともだちを てつだう";
  const TILES = ["まいにち", "ともだち", "を", "てつだう"];

  it("m29: kanji-fies ONLY the eligible unambiguous word (毎日); ambiguous/particle/conjugated stay kana", () => {
    const step = build("bs-m29", "Every day I help a friend", SENTENCE, TILES, TILES);
    const out = applyKanjiSurfaces(synthLesson("m29", [step]));
    const segs = collectSegments(out).map((s) => s.seg);

    // まいにち → 毎日 (m29 is past the unlock+2 furigana window at m22, so the
    // window flag is closed — but the kana reading is kept for the SRS gate).
    const mainichi = segs.find((s) => s.atomId === "mainichi")!;
    expect(mainichi.surface).toBe("毎日");
    expect(mainichi.reading).toBe("まいにち");
    expect(mainichi.furiganaWindowOpen).toBe(false);

    // Every OTHER sentence segment stays pure kana — ともだち (友達, catalog gap),
    // を (particle), てつだう (手伝う, catalog gap) are NEVER substituted.
    for (const s of segs) {
      if (s.atomId === "mainichi") continue;
      expect(HAS_HAN.test(s.surface)).toBe(false);
    }
    // Reference display reconstructs the sentence with only 毎日 in kanji.
    expect(segs.map((s) => s.surface).join("")).toBe("毎日 ともだちを てつだう");

    // Grading + audio fields byte-identical (KANA) — recognize-kanji /
    // assemble-from-kana asymmetry is intended.
    const bstep = out.steps[0] as typeof step;
    expect(bstep.tiles).toEqual(TILES);
    expect(bstep.correctOrder).toEqual(TILES);
    expect(bstep.targetSentence).toBe(SENTENCE);
    expect(bstep.audioKey).toBe(SENTENCE);
  });

  it("a conjugated form (のまない) in a sentence stays kana while its eligible neighbour kanji-fies", () => {
    const step = build("bs-conj", "I don't drink every day", "まいにち のまない", ["まいにち", "のまない"], ["まいにち", "のまない"]);
    const out = applyKanjiSurfaces(synthLesson("m29", [step]));
    const joined = collectSegments(out).map((s) => s.seg.surface).join("");
    expect(joined).toContain("毎日"); // eligible neighbour substituted
    expect(joined).toContain("のまない"); // conjugated form untouched
  });

  it("a homograph (はな = 花/鼻) in a sentence is NEVER kanji-fied at any module", () => {
    const step = build("bs-homo", "The flower is pretty", "はなが きれい", ["はな", "が", "きれい"], ["はな", "が", "きれい"]);
    const out = applyKanjiSurfaces(synthLesson("m29", [step]));
    for (const { seg } of collectSegments(out)) {
      expect(HAS_HAN.test(seg.surface)).toBe(false);
    }
  });

  it("§4a property holds for a synthetic multi-segment sentence step (audio/grading identical, atom multiset stable)", () => {
    const step = build("bs-prop", "Every day I help a friend", SENTENCE, TILES, TILES);
    const post = applyKanjiSurfaces(synthLesson("m29", [step])); // 毎日 substituted
    const pre = revertToKana(post);
    const post2 = applyKanjiSurfaces(pre);
    expect(withoutAnnotations(post2)).toEqual(withoutAnnotations(pre));
    expect(atomIdMultiset(post2)).toEqual(atomIdMultiset(pre));
    // Non-vacuous: the substitution actually fired.
    expect(collectSegments(post).some((s) => HAS_HAN.test(s.seg.surface))).toBe(true);
  });
});
