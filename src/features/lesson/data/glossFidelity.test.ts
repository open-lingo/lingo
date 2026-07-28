import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * AN ENGLISH GLOSS MAY NOT CONTRADICT ITS OWN JAPANESE.
 *
 * This is the defect class QA keeps finding and no gate covered. m23 shipped
 * eleven sentences glossing はいる ("to enter") as "check in" — contradicting
 * its own vocabulary card two screens away, and spending that word's single
 * exposure in the whole course on the wrong meaning. m28 glossed まいにち
 * ("every day") as "every evening"; QA caught one, and the first run of THIS
 * scan found three more of the same word in the same module.
 *
 * It cannot be checked in general — translation is not mechanical, and a guard
 * that flags good paraphrase gets deleted. So it is checked where it CAN be:
 * a curated list of words whose English is unambiguous and distinctive, with
 * generous alternatives so that natural phrasing passes. 242 checks fire
 * course-wide and only the real defects failed, which is the calibration to
 * hold. Add a word here only if you can write its acceptable renderings
 * exhaustively; if you cannot, it does not belong in this list.
 *
 * Matching is TOKEN-exact, never substring (Rule Zero) — 「あさ」 must not fire
 * on 「あさって」, and いま ⊄ かいます.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const IR_DIR = join(HERE, "../../languages/ja/curriculum/ir");

const GLOSS_MUST_CONTAIN: Record<string, string[]> = {
  // time
  まいにち: ["every day", "each day", "daily"],
  きのう: ["yesterday"],
  あした: ["tomorrow"],
  きょう: ["today", "this morning", "tonight", "this evening"],
  あさ: ["morning"],
  ばん: ["evening", "night", "tonight"],
  ひる: ["noon", "lunch", "midday", "afternoon"],
  // seasons
  なつ: ["summer"],
  ふゆ: ["winter"],
  はる: ["spring"],
  あき: ["autumn", "fall"],
  // people — the terms a learner most often sees blurred together
  せんせい: ["teacher", "professor", "doctor"],
  がくせい: ["student", "pupil"],
  せいと: ["pupil", "student"],
  いしゃ: ["doctor"],
  ちち: ["father", "dad"],
  はは: ["mother", "mum", "mom"],
  あに: ["older brother", "big brother", "elder brother"],
  あね: ["older sister", "big sister", "elder sister"],
  いもうと: ["younger sister", "little sister", "sister"],
  おとうと: ["younger brother", "little brother", "brother"],
  // the word that started this
  はいる: ["enter", "go in", "get in", "come in", "going in", "goes in", "went in", "join"],
};

type Beat = {
  ja?: string;
  en?: string;
  audio?: string;
  answer?: string;
};
type Lesson = { id?: string; beats?: Beat[] };

describe("glosses do not contradict their Japanese", () => {
  it("every curated word is rendered as one of its real meanings", () => {
    const files = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));
    let checks = 0;
    const offenders: string[] = [];

    for (const f of files) {
      const mod = f.replace(".ir.json", "");
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as {
        lessons?: Lesson[];
      };
      for (const lesson of ir.lessons ?? []) {
        for (const beat of lesson.beats ?? []) {
          // Both shapes carry a Japanese string and its English: authored
          // sentences as ja/en, listening items as audio/answer.
          const pairs: [string, string][] = [];
          if (beat.ja && beat.en) pairs.push([beat.ja, beat.en]);
          if (beat.audio && beat.answer) pairs.push([beat.audio, beat.answer]);

          for (const [ja, en] of pairs) {
            const tokens = ja.split(/[\s　]+/).map((t) => t.replace(/[。、？！]/g, ""));
            for (const [word, acceptable] of Object.entries(GLOSS_MUST_CONTAIN)) {
              if (!tokens.includes(word)) continue;
              checks++;
              const lower = en.toLowerCase();
              if (!acceptable.some((a) => lower.includes(a))) {
                offenders.push(
                  `${mod} ${lesson.id}: 「${word}」 appears in 「${ja}」 but the gloss ` +
                    `"${en}" says none of [${acceptable.join(", ")}]`,
                );
              }
            }
          }
        }
      }
    }

    // Non-vacuity: a gloss checker that stops finding words to check reads
    // exactly like a clean course. The IR shape has moved before.
    expect(checks, "no glosses checked — the IR beat shape moved")
      .toBeGreaterThan(150);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("matches whole tokens, so a longer word cannot trigger a shorter one", () => {
    // 「あさ」 must not fire inside 「あさって」, and a gloss is only required
    // when the word is actually present.
    const tokens = "あさって うみに いく".split(/[\s　]+/);
    expect(tokens.includes("あさ")).toBe(false);
    expect("まいにち はたらく".split(/[\s　]+/).includes("まいにち")).toBe(true);
  });
});
