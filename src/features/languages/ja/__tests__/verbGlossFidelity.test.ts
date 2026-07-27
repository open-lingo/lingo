import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A verb's English gloss must be the verb the course actually taught.
 *
 * みる is glossed "to watch, to look at" in the atom registry, and よむ ("to
 * read") is taught in no module at all — yet 「ほんを みる」 was glossed "read a
 * book" in m13 and then, systematically, ~11 times across m15. Two modules
 * teaching a learner that みる means "read" is not a typo, it is a wrong
 * vocabulary item being installed, and it survived two rounds of QA on the
 * Japanese because the JAPANESE was fine.
 *
 * This checks the pairing rather than either side alone. It is a small, exact
 * list on purpose: only verbs whose mistranslation has actually shipped, so a
 * failure here always means something real.
 */

const IR_DIR = join(__dirname, "..", "curriculum", "ir");

type Rule = {
  /** Japanese surfaces that identify the verb. */
  ja: RegExp;
  /** English that would misname it. */
  en: RegExp;
  /** Surfaces that legitimately license that English, if any. */
  licensed?: RegExp;
  why: string;
};

const RULES: Rule[] = [
  {
    ja: /み(る|た|て|ます|ました|たい)/,
    en: /\bread(s|ing)?\b/i,
    licensed: /よ(む|んだ|んで|みます)/,
    why: 'みる is "watch / look at". よむ is "read" and is taught in no module — ' +
      "if the sentence means read, it needs a verb the course has actually given " +
      "the learner.",
  },
];

function beatLines(): { where: string; line: string }[] {
  const out: { where: string; line: string }[] = [];
  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.yaml"))) {
    const src = readFileSync(join(IR_DIR, file), "utf-8");
    src.split("\n").forEach((line, i) => {
      // Only lines that pair Japanese with English on the same beat.
      if (!/\b(ja|audio|answer|q):/.test(line) && !/\ben:/.test(line)) return;
      out.push({ where: `${file}:${i + 1}`, line });
    });
  }
  return out;
}

describe("verb glosses name the verb the course taught", () => {
  const lines = beatLines();

  it("has beats to check", () => {
    expect(lines.length).toBeGreaterThan(500);
  });

  for (const rule of RULES) {
    it(`never mistranslates: ${rule.why.slice(0, 48)}…`, () => {
      const offenders = lines
        .filter(({ line }) => {
          // The rule block's own prose is allowed to discuss the contrast.
          if (/^\s*(rule|explanation|why|#)/.test(line)) return false;
          if (!rule.ja.test(line) || !rule.en.test(line)) return false;
          return !(rule.licensed && rule.licensed.test(line));
        })
        .map(({ where }) => where);

      expect(offenders, rule.why).toEqual([]);
    });
  }
});
