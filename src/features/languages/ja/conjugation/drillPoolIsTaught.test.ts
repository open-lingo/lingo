import { describe, expect, it } from "vitest";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../conjugationTables";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

/**
 * A DRILL MAY ONLY USE WORDS THE COURSE HAS ACTUALLY TAUGHT.
 *
 * `introducedAtModule` in `conjugationTables.ts` is the only thing standing
 * between the trainer and a word the learner has never met — `getVerbsUpToModule`
 * trusts it completely. It had drifted badly: 24 of 45 verbs were listed
 * earlier than the course reaches them, and eleven entries (かく, もつ, かかる,
 * みがく, かす, でる, きる, まずい, つめたい, ふべん, かんたん) appeared NOWHERE in
 * the course in any form. Nobody noticed while the trainer was optional
 * practice you opted into. Then trainer nodes became REQUIRED path stops, a
 * simulated learner hit m13's, and the drill asked it to conjugate でかける —
 * a verb no lesson has ever shown, whose class (る-verb vs う-verb) is
 * therefore unguessable, with both candidate answers on screen.
 *
 * EXPOSURE, NOT MENTION. The word must appear where the learner can READ it —
 * a tile, an option, a card example, a sentence. A drill prompt showing it
 * does not count; that is the trainer teaching itself.
 */

/** Every exact Japanese token the course puts in front of the learner, by module. */
function tokensByModule(): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>();
  for (const mod of getMockCourse("ja").modules) {
    const n = parseInt(mod.id.slice(1), 10);
    if (isNaN(n)) continue;
    const set = out.get(n) ?? new Set<string>();
    const add = (s: unknown) => {
      if (typeof s !== "string") return;
      for (const tok of s.split(/[\s　、。？！「」（）()]+/)) if (tok) set.add(tok);
    };
    const walk = (node: unknown): void => {
      if (typeof node === "string") return add(node);
      if (!node || typeof node !== "object") return;
      for (const v of Object.values(node as Record<string, unknown>)) walk(v);
    };
    for (const row of mod.lessons ?? []) {
      if (row.kind === "trainer") continue; // the drill is not exposure
      const lesson = getMockLessonContent(row.id);
      if (lesson) walk(lesson.steps);
    }
    out.set(n, set);
  }
  return out;
}

const LAST_MODULE = 29;

describe("conjugation drill pool only uses taught words", () => {
  const byModule = tokensByModule();
  const modules = [...byModule.keys()].sort((a, b) => a - b);

  it("scanned a real course", () => {
    expect(modules.length).toBeGreaterThan(20);
    const total = modules.reduce((n, m) => n + byModule.get(m)!.size, 0);
    expect(total, "token scrape produced almost nothing — the scan is broken").toBeGreaterThan(2000);
  });

  it("every drillable verb and adjective is taught by the module it unlocks at", () => {
    const entries = [
      ...VERB_ENTRIES.map((e) => ({ word: e.dictionary, at: e.introducedAtModule })),
      ...ADJ_ENTRIES.map((e) => ({ word: e.dictionary, at: e.introducedAtModule })),
    ];
    // Entries parked above the course are deliberately out of every pool.
    const drillable = entries.filter((e) => e.at <= LAST_MODULE);
    expect(drillable.length, "no drillable entries — the filter is wrong").toBeGreaterThan(30);

    const offenders: string[] = [];
    for (const { word, at } of drillable) {
      let firstSeen: number | null = null;
      for (const m of modules) {
        if (byModule.get(m)!.has(word)) {
          firstSeen = m;
          break;
        }
      }
      if (firstSeen === null)
        offenders.push(`${word}: drillable from m${at}, never appears in the course`);
      else if (firstSeen > at)
        offenders.push(`${word}: drillable from m${at}, but the course first shows it in m${firstSeen}`);
    }
    expect(offenders).toEqual([]);
  });
});
