import { describe, expect, it } from "vitest";
import { getCompiledCourse } from "@/test/fixtures/compiledCourse";

/**
 * Regression gate for TestFlight #173/#175 (build 22, m34): the tile
 * tokenizer (`makeTokenizer`, moduleCompiler.ts) is greedy longest-match over
 * every registered atom. とお (十, "ten") is a taught atom, so an authored
 * Japanese string that FUSES the quotative と onto おもう — とおもう, written
 * with no space — tokenizes as とお + もう instead of と + おもう. m18
 * established the fix as an authoring convention: an authored space is a
 * hard tokenizer boundary (「あした いくと おもう。」 → いく|と|おもう). m34
 * shipped every instance fused (「しごとを さがそうとおもう。」), so every
 * build/listening_build tile bank and target order for those beats carried
 * the mis-split とお|もう pair instead of と|おもう.
 *
 * This walks every COMPILED lesson (all languages, so a future course that
 * reuses と + a とお-prefixed atom is covered too) rather than grepping IR
 * source, because the tokenizer runs at compile time and a source-level grep
 * cannot see which atoms are registered or how longest-match resolves.
 */
describe("build-tile fused-quotative split (とおもう → とお|もう)", () => {
  it("no build/listening_build tile array carries the adjacent とお,もう pair", () => {
    const violations: string[] = [];
    for (const { id, content: lesson } of getCompiledCourse()) {
      for (const s of lesson.steps) {
        if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = s as any;
        const arrays: Array<[string, unknown[]]> = [
          ["tiles/wordBank", a.tiles ?? a.wordBank ?? []],
          ["correctOrder", a.correctOrder ?? []],
        ];
        for (const [field, arr] of arrays) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === "とお" && arr[i + 1] === "もう") {
              violations.push(`${id}/${s.id} (${field}): [..."とお","もう"...] — fused とおもう split by longest-match on とお (十). Author the source with a space: "…と おもう" (m18 convention).`);
            }
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
