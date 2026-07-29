/**
 * Kanji switchover gallery (/ja/qa/kanji-switchover) — pins the pedagogical
 * constraints of the demo steps. These are the properties that make the
 * variants honest examples rather than pretty mockups, and each one is a
 * mistake that would ship straight into m19 if the gallery were copied.
 */
import { describe, it, expect } from "vitest";
import { isKana } from "@/shared/japanese/kanaTable";
import { DEMO_STEPS } from "./KanjiSwitchoverVariantsPage";

const READING_STEPS = [DEMO_STEPS.bareRead, DEMO_STEPS.pretest] as const;

describe("kanji switchover demo steps", () => {
  it("kanji_reading never offers a kanji option (no-kanji-production policy)", () => {
    for (const step of READING_STEPS) {
      const s = step as unknown as { options: { text: string }[] };
      for (const o of s.options) {
        expect(
          Array.from(o.text).every((c) => isKana(c)),
          `${o.text} is not pure kana — that would make it a spelling test`,
        ).toBe(true);
      }
    }
  });

  it("exactly one option is correct, and it is the real reading", () => {
    for (const step of READING_STEPS) {
      const s = step as unknown as {
        reading: string;
        options: { id: string; text: string }[];
        correctOptionId: string;
      };
      const correct = s.options.filter((o) => o.id === s.correctOptionId);
      expect(correct).toHaveLength(1);
      expect(correct[0].text).toBe(s.reading);
      // No distractor may duplicate the answer.
      expect(s.options.filter((o) => o.text === s.reading)).toHaveLength(1);
    }
  });

  it("the 明日 pretest does not offer あす — it is ALSO a correct reading", () => {
    const s = DEMO_STEPS.pretest as unknown as { options: { text: string }[] };
    expect(s.options.map((o) => o.text)).not.toContain("あす");
  });

  it("furigana is suppressed on the prompt (the reading IS the answer)", () => {
    for (const step of READING_STEPS) {
      const s = step as unknown as {
        kanji: string;
        promptAnnotation: { surface: string; reading: string }[];
      };
      // reading === surface has nothing to float — see AnnotatedText.
      for (const seg of s.promptAnnotation) {
        expect(seg.reading).toBe(seg.surface);
      }
      expect(s.promptAnnotation.map((x) => x.surface).join("")).toBe(s.kanji);
    }
  });

  it("variant F offers the kanji form as the CORRECT answer, never a distractor", () => {
    const s = DEMO_STEPS.oneOfFour as unknown as {
      options: { id: string; text: string }[];
      correctOptionId: string;
    };
    const correct = s.options.find((o) => o.id === s.correctOptionId)!;
    expect(correct.text).toBe("友達");
    // Offering 友達 as a wrong option would train the learner that the kanji
    // form of a word they know is incorrect — the one thing this must never do.
    const wrong = s.options.filter((o) => o.id !== s.correctOptionId);
    expect(wrong.map((o) => o.text)).not.toContain("友達");
  });
});
