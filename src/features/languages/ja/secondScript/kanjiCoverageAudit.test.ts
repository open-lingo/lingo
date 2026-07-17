import { describe, expect, it } from "vitest";
import { N5_KANJI } from "./n5Kanji";
import {
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_ID,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";

/**
 * KANJI + FURIGANA COVERAGE DRY-RUN (scoping deliverable, 2026-07-16).
 *
 * A behavior-neutral REPORT — it changes nothing, wires nothing into a live
 * content path. It answers three questions the kanji-implementation spec
 * (docs/kanji-implementation-spec-2026-07-16.md) needs to size v1:
 *
 *   1. Via the N5_KANJI.anchorVocab -> course-atom-id mapping the plan
 *      proposes, WHICH distinct atoms would gain a kanji surface, bucketed by
 *      the module at which they'd unlock?
 *   2. How many OCCURRENCES across authored lesson strings is that (both the
 *      precise "single-atom surface" count the v1 hook actually fires on, and
 *      the loose substring superset)?
 *   3. What is the m23-27 coverage gap (atoms authored in m23-27 that carry a
 *      kanji form but no N5_KANJI catalog entry can unlock)?
 *
 * KEYED ON ATOMS/SURFACES, NOT STEP COUNTS — a concurrent info-step purge is
 * changing step counts across curriculum/*.ts but not the vocab atoms, so
 * every headline number here is stable against that churn.
 *
 * Follows the env-gated precedent of buildTileDistractorAudit.test.ts:
 *
 *   KANJI_COVERAGE_AUDIT=1 npx vitest run \
 *     src/features/languages/ja/secondScript/kanjiCoverageAudit.test.ts
 *
 * The always-on smoke test below keeps the audit machinery honest (atoms
 * resolve, arithmetic is non-negative) even when the print is skipped.
 */

const HAS_HAN = /\p{Script=Han}/u;

/** First kanji-bearing token of a CourseAtom.kanji field. The field may hold
 *  several forms ("川 / 河", "見る  観る") or be pure kana ("いい / よい"); we
 *  treat an atom as kanji-substitutable only when SOME token contains Han. */
function kanjiSurface(atom: CourseAtom | undefined): string | null {
  if (!atom?.kanji) return null;
  const first = atom.kanji.split(/[\s/]+/).find((t) => HAS_HAN.test(t));
  return first ?? null;
}

/** Count distinct Han characters in a string (multi-kanji-word detector). */
function distinctHanCount(s: string): number {
  const set = new Set<string>();
  for (const ch of s) if (HAS_HAN.test(ch)) set.add(ch);
  return set.size;
}

type AnchorRow = {
  atomId: string;
  resolved: boolean;
  kanji: string | null;
  /** Earliest introducedAtModule among N5_KANJI entries anchoring this atom
   *  — the plan's eager "introducedAtModule <= currentModule" unlock point. */
  unlockModule: number;
  multiKanji: boolean;
};

/** Build the anchorVocab -> atom mapping the plan keys substitution on. */
function collectAnchorRows(): {
  rows: AnchorRow[];
  unresolvedIds: string[];
} {
  // atomId -> earliest anchoring module
  const earliest = new Map<string, number>();
  for (const k of N5_KANJI) {
    for (const id of k.anchorVocab) {
      const prev = earliest.get(id);
      if (prev === undefined || k.introducedAtModule < prev) {
        earliest.set(id, k.introducedAtModule);
      }
    }
  }
  const rows: AnchorRow[] = [];
  const unresolvedIds: string[] = [];
  for (const [atomId, unlockModule] of earliest) {
    const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
    if (!atom) {
      unresolvedIds.push(atomId);
      rows.push({ atomId, resolved: false, kanji: null, unlockModule, multiKanji: false });
      continue;
    }
    const kanji = kanjiSurface(atom);
    rows.push({
      atomId,
      resolved: true,
      kanji,
      unlockModule,
      multiKanji: kanji ? distinctHanCount(kanji) > 1 : false,
    });
  }
  return { rows, unresolvedIds };
}

/** Recursively collect every string value under a lesson's steps. Occurrences
 *  count repeats (a tile that appears 3x is 3 occurrences). English strings
 *  are harmless — kana atoms never match them. */
function collectJaStrings(): string[] {
  const out: string[] = [];
  const visit = (v: unknown): void => {
    if (typeof v === "string") {
      out.push(v);
    } else if (Array.isArray(v)) {
      for (const el of v) visit(el);
    } else if (v && typeof v === "object") {
      for (const el of Object.values(v as Record<string, unknown>)) visit(el);
    }
  };
  for (const id of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(id);
    if (!lesson || lesson.languageId !== "ja") continue;
    visit(lesson.steps);
  }
  return out;
}

type ModuleBucket = {
  module: number;
  atomsWithKanji: number;
  atomsNoKanji: number;
  multiKanjiAtoms: number;
  exactOccurrences: number;
  substringOccurrences: number;
};

function buildReport(): {
  rows: AnchorRow[];
  unresolvedIds: string[];
  buckets: ModuleBucket[];
  gapAtoms: CourseAtom[];
  jaStringCount: number;
  shortKanaAtoms: string[];
} {
  const { rows, unresolvedIds } = collectAnchorRows();
  const jaStrings = collectJaStrings();

  // Precise, mechanism-faithful occurrence (v1 hook fires only when a whole
  // annotation surface === one atom's kana) vs. loose substring superset.
  const exactOf = (kana: string) => jaStrings.filter((s) => s === kana).length;
  const subOf = (kana: string) =>
    jaStrings.filter((s) => s.includes(kana)).length;

  const byModule = new Map<number, ModuleBucket>();
  const shortKanaAtoms: string[] = [];
  for (const r of rows) {
    if (!r.resolved) continue;
    const atom = JA_COURSE_ATOMS_BY_ID.get(r.atomId)!;
    let b = byModule.get(r.unlockModule);
    if (!b) {
      b = {
        module: r.unlockModule,
        atomsWithKanji: 0,
        atomsNoKanji: 0,
        multiKanjiAtoms: 0,
        exactOccurrences: 0,
        substringOccurrences: 0,
      };
      byModule.set(r.unlockModule, b);
    }
    if (r.kanji) {
      b.atomsWithKanji++;
      if (r.multiKanji) b.multiKanjiAtoms++;
      b.exactOccurrences += exactOf(atom.kana);
      b.substringOccurrences += subOf(atom.kana);
      if ([...atom.kana].length <= 2) shortKanaAtoms.push(`${r.atomId}(${atom.kana})`);
    } else {
      b.atomsNoKanji++;
    }
  }
  const buckets = [...byModule.values()].sort((a, b) => a.module - b.module);

  // Coverage gap: atoms authored in m23-27 that carry a kanji form but are not
  // reachable through any anchorVocab entry (no catalog entry can unlock them).
  const anchoredIds = new Set(rows.map((r) => r.atomId));
  const lateModules = new Set(["m23", "m24", "m25", "m26", "m27"]);
  const gapAtoms = JA_COURSE_ATOMS.filter(
    (a) =>
      lateModules.has(a.fromModule) &&
      kanjiSurface(a) !== null &&
      !anchoredIds.has(a.id),
  );

  return {
    rows,
    unresolvedIds,
    buckets,
    gapAtoms,
    jaStringCount: jaStrings.length,
    shortKanaAtoms,
  };
}

export function formatReport(): string {
  const {
    rows,
    unresolvedIds,
    buckets,
    gapAtoms,
    jaStringCount,
    shortKanaAtoms,
  } = buildReport();

  const resolved = rows.filter((r) => r.resolved);
  const withKanji = resolved.filter((r) => r.kanji);
  const lines: string[] = [];
  lines.push("=== KANJI + FURIGANA COVERAGE DRY-RUN ===");
  lines.push(`N5_KANJI entries: ${N5_KANJI.length}`);
  lines.push(
    `distinct anchorVocab atom ids: ${rows.length}  (resolved ${resolved.length}, UNRESOLVED ${unresolvedIds.length})`,
  );
  lines.push(
    `  of resolved: ${withKanji.length} have a kanji surface, ${resolved.length - withKanji.length} do NOT (kana-only atom — anchorVocab points at a form with no stored kanji)`,
  );
  if (unresolvedIds.length) {
    lines.push(`  UNRESOLVED anchorVocab ids (catalog references a non-existent atom id):`);
    lines.push(`    ${unresolvedIds.join(", ")}`);
  }
  const noKanji = resolved.filter((r) => !r.kanji).map((r) => r.atomId);
  if (noKanji.length) {
    lines.push(`  resolved-but-no-kanji-surface atom ids: ${noKanji.join(", ")}`);
  }
  lines.push("");
  lines.push(`JA lesson strings walked: ${jaStringCount}`);
  lines.push(
    `NOTE: exact = lesson strings that EQUAL the atom kana (the v1 hook's true firing set — single-atom surfaces).`,
  );
  lines.push(
    `      substring = loose superset incl. mid-sentence appearances (needs tokenization to substitute safely).`,
  );
  lines.push("");
  lines.push(
    `unlock-module | atoms→kanji | (multi-kanji) | atoms no-kanji | exact occ | substring occ`,
  );
  let tK = 0,
    tExact = 0,
    tSub = 0,
    tMulti = 0;
  for (const b of buckets) {
    tK += b.atomsWithKanji;
    tExact += b.exactOccurrences;
    tSub += b.substringOccurrences;
    tMulti += b.multiKanjiAtoms;
    lines.push(
      `  m${String(b.module).padStart(2)}        | ${String(b.atomsWithKanji).padStart(9)} | ${String(b.multiKanjiAtoms).padStart(11)} | ${String(b.atomsNoKanji).padStart(12)} | ${String(b.exactOccurrences).padStart(8)} | ${String(b.substringOccurrences).padStart(12)}`,
    );
  }
  lines.push(
    `  TOTAL       | ${String(tK).padStart(9)} | ${String(tMulti).padStart(11)} | ${" ".padStart(12)} | ${String(tExact).padStart(8)} | ${String(tSub).padStart(12)}`,
  );
  lines.push("");
  lines.push(
    `multi-kanji words (${tMulti}): eager MIN-unlock would show them before ALL component kanji are taught — v1 needs a MAX-of-components (or allowlist) gate.`,
  );
  lines.push(
    `short-kana atoms flagged (substring unreliable): ${shortKanaAtoms.length ? shortKanaAtoms.join(", ") : "none"}`,
  );
  lines.push("");
  lines.push(`=== m23-27 COVERAGE GAP ===`);
  const lateCatalog = N5_KANJI.filter((k) => k.introducedAtModule >= 23).length;
  lines.push(`N5_KANJI entries with introducedAtModule >= 23: ${lateCatalog}`);
  lines.push(
    `atoms authored in m23-27 that HAVE a kanji form but no anchorVocab can unlock: ${gapAtoms.length}`,
  );
  if (gapAtoms.length) {
    lines.push(
      `  ${gapAtoms.map((a) => `${a.id}(${a.kanji}·${a.fromModule})`).join(", ")}`,
    );
  }
  return lines.join("\n");
}

describe("kanji coverage dry-run", () => {
  it.skipIf(!process.env.KANJI_COVERAGE_AUDIT)("prints the coverage report", () => {
    const report = "\n" + formatReport() + "\n";
    // eslint-disable-next-line no-console
    console.log(report);
    // vitest run swallows console.log on some reporters — KANJI_AUDIT_OUT lets
    // a caller capture the table deterministically to a file.
    if (process.env.KANJI_AUDIT_OUT) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("node:fs") as typeof import("node:fs");
      fs.writeFileSync(process.env.KANJI_AUDIT_OUT, report);
    }
    expect(N5_KANJI.length).toBeGreaterThan(0);
  });

  // Always-on smoke: the anchorVocab mapping resolves at least some atoms to a
  // kanji surface, and the walker finds JA content. Guards the audit itself.
  it("anchorVocab maps to at least one kanji-bearing atom and JA content exists", () => {
    const { rows, buckets, jaStringCount } = buildReport();
    const withKanji = rows.filter((r) => r.resolved && r.kanji);
    expect(withKanji.length).toBeGreaterThan(0);
    expect(jaStringCount).toBeGreaterThan(0);
    for (const b of buckets) {
      expect(b.exactOccurrences).toBeGreaterThanOrEqual(0);
      expect(b.substringOccurrences).toBeGreaterThanOrEqual(b.exactOccurrences);
    }
  });
});
