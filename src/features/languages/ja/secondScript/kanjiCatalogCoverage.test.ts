/**
 * KANJI CATALOG COVERAGE GATE (TestFlight #104/#110/#163/#173/#194 class).
 *
 * `N5_KANJI` (`./n5Kanji.ts`) is a curated, hand-maintained character list.
 * `applyKanjiSurfaces.ts`'s `buildEligibleMap()` requires EVERY component
 * kanji of an atom's dictionary surface (`CourseAtom.kanji`, parsed by that
 * file's `dictionaryKanjiSurface()` — the FIRST Han-bearing token, mirrored
 * here as `firstHanToken`) to have its own `N5_KANJI` entry before that
 * atom's kanji spelling can be shown ANYWHERE (sentence substitution,
 * build/listening tiles — see that file's docstring). The catalog stopped
 * growing at m27 for four TestFlight cycles running (#104 → #110 → #163 →
 * #194, the same れんしゅうする/そうじする gap reported four times, four
 * per-word patches — see
 * `docs/user-feedback/2026-09-17-testflight-b28.md` §2 "B28B — #194") —
 * every one of those was this exact silent-catalog-drift class, not a new
 * bug each time.
 *
 * WHY A CEILING, NOT A ZERO-TOLERANCE GATE (read before changing
 * `KNOWN_UNCATALOGUED_CEILING` — this is the judgment call this gate makes
 * explicit rather than hiding):
 *
 * A live sweep at authoring time (2026-09-18, lane SMALLREDS item A) found
 * 465 live atoms with SOME kanji spelling, of which 300 (367 individual
 * character-instances) are currently uncatalogued. That is NOT the
 * #104-class bug at authoring-lane scale — `N5_KANJI` is a deliberately
 * curated ~110-entry list for the dedicated second-script TEACHING
 * sequence (its own name says N5; `tier: "exposure"` entries are the
 * documented, deliberate extras), not a mirror of the whole vocabulary.
 * Most of those 300 atoms (梅 "uma"/馬 in m1, for example) were never
 * intended to kanji-substitute — they stay kana-with-emoji forever by
 * design, same as `applyKanjiSurfaces.ts`'s own documented permanent
 * exclusions (時計's 計, 友達's 達). Demanding all 367 be catalogued or
 * individually allow-listed here would mean either (a) a ~300-character
 * authoring project this lane has no product mandate for — HARD RULE, see
 * `docs/*es-author-with-sonnet-agents*` memory: bulk content authoring is
 * not inline agent work — or (b) an unreviewed 300-entry rubber-stamp
 * allow-list that asserts nothing.
 *
 * So this gate enforces the part that IS a pure regression risk with zero
 * content judgment required: the backlog can never SILENTLY GROW. Today's
 * count is pinned as a ceiling (regression-classes C7 — lowered as atoms
 * get properly catalogued, never raised without a stated reason). A new
 * module (m47+) that ships a new live, kanji-bearing atom without
 * extending `N5_KANJI` pushes the real count above the ceiling and this
 * test fails immediately, naming the atom — catching the #104 class BEFORE
 * a fifth TestFlight report, without this lane pretending to have made an
 * editorial call on 300 words it was never asked to review.
 *
 * Escalation flagged to the lead (see the lane report): is `N5_KANJI`
 * meant to (a) stay a deliberately narrow second-script teaching subset
 * (this gate's assumption), or (b) grow toward full N4 vocabulary
 * coverage (a real authoring project, scoped and staffed separately)? The
 * gate is safe either way — (a) means the ceiling should only ever go
 * down as N5_KANJI entries get cleaned up; (b) means a future lane lowers
 * the ceiling in the same commits that extend the catalog.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { N5_KANJI, type KanjiEntry } from "./n5Kanji";
import { JA_COURSE_ATOMS, type CourseAtom } from "@/features/languages/ja/courseAtoms";

const HAS_HAN = /\p{Script=Han}/u;

/**
 * Today's known backlog (2026-09-18 sweep) — see the file docstring for
 * why this is a ceiling, not a zero. LOWER this number whenever a batch of
 * atoms gets properly catalogued (and delete their now-covered characters
 * from the failure this test would otherwise print). NEVER raise it
 * without a stated reason recorded here, in a commit message that says
 * why (regression-classes C7): the only legitimate reason to raise it is
 * "N5_KANJI is being deliberately scoped down / an atom's kanji field
 * changed," never "a new module shipped more uncatalogued vocab" — that
 * case is exactly what this gate exists to block.
 */
// KANJICAT lane (2026-09-18): all 8 introducedAtModule batches (m8-12
// through m43-47) landed — 298 Jōyō characters catalogued in N5_KANJI, the
// remaining 6 individually reviewed and allow-listed above (non-Jōyō or the
// odoriji iteration mark). 367 -> 0: every live uncatalogued character is
// now either catalogued or an explicit, justified exception. See the lane
// report for the full per-batch breakdown and before/after measurements.
const KNOWN_UNCATALOGUED_CEILING = 0;

/** Explicit exceptions: a Han character a LIVE atom's dictionary-form
 *  kanji surface carries that is PERMANENTLY excluded from `N5_KANJI` by a
 *  real product decision (not just "hasn't been added yet" — that case
 *  lives under the ceiling above, not here). Empty today — nothing has
 *  been reviewed and deliberately excluded via this mechanism yet; the
 *  known permanent exclusions named in `applyKanjiSurfaces.ts`'s own
 *  docstring (時計's 計, 友達's 達) belong to non-live atoms in the current
 *  sweep and so don't need an entry here today, but the mechanism exists
 *  for the day one does. An entry here is REMOVED from the ceiling count
 *  (it's a permanent decision, not backlog), so adding one without
 *  lowering `KNOWN_UNCATALOGUED_CEILING` by the same amount is a mistake
 *  this file's own self-test would not catch — check the printed count by
 *  hand when you add one. */
// KANJICAT lane (2026-09-18): every live uncatalogued character was swept
// (see the lane report). 298 of the 304 distinct characters were Jōyō
// (`./joyo.ts`, KANJIDIC2 grade 1–8) and got real `N5_KANJI` entries. These
// 6 are the ones that are not — individually reviewed via KANJIDIC2, not a
// rubber-stamp — and so belong here instead, each REMOVED from the ceiling
// count below (KNOWN_UNCATALOGUED_CEILING was lowered by 6 for exactly
// these, on top of the 298 catalogued elsewhere bringing it from 367 to 0).
const ALLOWED_UNCATALOGUED_CHARS: Record<string, string> = {
  嘘: "non-Jōyō/N3+ — stays kana", // uso "a lie" (m1) — informal/colloquial, not in KANJIDIC2's grade 1–8 Jōyō set
  賑: "non-Jōyō/N3+ — stays kana", // 賑やか nigiyaka "bustling" (m12) — KANJIDIC2 grade 9 (jinmeiyō), not Jōyō
  叱: "non-Jōyō/N3+ — stays kana", // shikaru "to scold" (m40) — not in KANJIDIC2's grade 1–8 Jōyō set
  噂: "non-Jōyō/N3+ — stays kana", // uwasa "rumor" (m42) — KANJIDIC2 grade 9 (jinmeiyō), not Jōyō
  躾: "non-Jōyō/N3+ — stays kana", // shitsuke "discipline/upbringing" (m45) — a kokuji, not in KANJIDIC2's grade 1–8 Jōyō set
  々: "non-Jōyō/N3+ — stays kana", // 時々 tokidoki (m22) — the iteration/repetition mark (odoriji); not an independent kanji, has no KANJIDIC2 entry at all
};

/** Highest authored JA module, read from the curriculum directory itself
 *  (`mN-neo.ts`, the compiled-module naming convention from m3 onward —
 *  see `codebase-search`'s "eager m*.ts glob" note for why
 *  `.test.ts`/`.render.test.tsx` must never be swept in). Computed, not
 *  hand-maintained, so a NEW module landing (m47+) raises this gate's own
 *  "live" ceiling automatically. */
function maxLiveModuleFromCurriculum(): number {
  const curriculumDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../curriculum");
  const entries = fs.readdirSync(curriculumDir);
  let max = 0;
  for (const name of entries) {
    const m = /^m(\d+)-neo\.ts$/.exec(name);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

/** True when `atom.fromModule` names a live, authored module — a plain
 *  `"m<N>"` string with `N <= maxLiveModule`. Excludes `"future"` (never
 *  shown to any learner) AND forward-attributed tags with no curriculum
 *  file yet (`"m49"`, `"m50"`, `"thr-n4"`, `"sidequest-survival"` — see
 *  courseAtoms.ts's `CourseAtomSource` docstring: "None of these modules
 *  is authored yet"). A plain regex + numeric ceiling, not a hardcoded
 *  allowlist of tag strings, so a real new module (authored as
 *  "m47-neo.ts") is automatically live once `maxLiveModuleFromCurriculum`
 *  sees its file, with zero edits to this predicate. */
function isLiveModule(fromModule: CourseAtom["fromModule"], maxLiveModule: number): boolean {
  const m = /^m(\d+)$/.exec(fromModule);
  if (!m) return false;
  return parseInt(m[1], 10) <= maxLiveModule;
}

/** The FIRST Han-bearing token of a `CourseAtom.kanji` field — identical
 *  to `applyKanjiSurfaces.ts`'s private `dictionaryKanjiSurface()` (not
 *  exported from there, so mirrored here rather than adding an export
 *  this lane doesn't otherwise need): the field may hold alternates
 *  ("川 / 河", "見る  観る") or be pure kana ("いい / よい"); only the
 *  first Han-bearing token is what the runtime ever actually reads. An
 *  unused LATER alternate's characters (観, 河 above) are deliberately
 *  NOT checked — they can never surface today regardless of catalog
 *  state, so flagging them would be noise, not signal. */
function firstHanToken(kanjiField: string): string | null {
  const first = kanjiField.split(/[\s/]+/).find((t) => HAS_HAN.test(t));
  return first ?? null;
}

/** Distinct Han characters in a string. */
function hanCharsOf(s: string): string[] {
  const set = new Set<string>();
  for (const ch of s) if (HAS_HAN.test(ch)) set.add(ch);
  return [...set];
}

type Violation = { atomId: string; char: string; token: string; fromModule: string };

/** The gate's actual check, factored out as a pure function so the
 *  "prove it can fail" self-test below can run it against a synthetic
 *  catalog/atom set with a KNOWN gap, independent of the real N5_KANJI
 *  data. */
function findUncataloguedChars(
  atoms: readonly CourseAtom[],
  catalog: readonly KanjiEntry[],
  maxLiveModule: number,
  allowlist: Record<string, string>,
): Violation[] {
  const catalogChars = new Set(catalog.map((k) => k.character));
  const violations: Violation[] = [];
  for (const atom of atoms) {
    if (!isLiveModule(atom.fromModule, maxLiveModule)) continue;
    if (!atom.kanji) continue;
    const token = firstHanToken(atom.kanji);
    if (!token) continue;
    for (const char of hanCharsOf(token)) {
      if (catalogChars.has(char)) continue;
      if (char in allowlist) continue;
      violations.push({ atomId: atom.id, char, token, fromModule: atom.fromModule });
    }
  }
  return violations;
}

describe("kanji catalog coverage gate", () => {
  it("prove the verifier can fail: a synthetic atom with an uncatalogued character is caught, an allow-listed one is not", () => {
    const syntheticCatalog: KanjiEntry[] = [
      {
        character: "食",
        onyomi: ["ショク"],
        kunyomi: ["た.べる"],
        meaning: ["eat"],
        strokeCount: 9,
        introducedAtModule: 5,
        anchorVocab: ["taberu"],
        category: "verb",
      },
    ];
    const syntheticAtoms: CourseAtom[] = [
      // Every component char catalogued — must NOT be flagged.
      { id: "taberu", kana: "たべる", kanji: "食べる", romaji: "taberu", meaningEn: "eat", fromModule: "m5", kind: "vocab", pos: "verb" },
      // 練 and 習 are NOT in `syntheticCatalog` — both must be flagged.
      { id: "renshuusuru", kana: "れんしゅうする", kanji: "練習する", romaji: "renshuusuru", meaningEn: "to practice", fromModule: "m34", kind: "vocab", pos: "verb" },
      // Beyond the live ceiling — must NOT be flagged (not reachable yet).
      { id: "future-word", kana: "みらい", kanji: "未来", romaji: "mirai", meaningEn: "future", fromModule: "future", kind: "vocab", pos: "noun" },
      // Only a LATER, unused alternate is uncatalogued — must NOT be
      // flagged (mirrors 見る/観る, 川/河 in the real data).
      { id: "miru-alt", kana: "みる", kanji: "食る / 未来", romaji: "miru", meaningEn: "(synthetic alt-form case)", fromModule: "m5", kind: "vocab", pos: "verb" },
    ];

    const withoutAllowlist = findUncataloguedChars(syntheticAtoms, syntheticCatalog, 46, {});
    expect(withoutAllowlist).toHaveLength(2); // 練 then 習, both from renshuusuru
    expect(withoutAllowlist.map((v) => v.char)).toEqual(["練", "習"]);
    expect(withoutAllowlist.every((v) => v.atomId === "renshuusuru")).toBe(true);

    const withAllowlist = findUncataloguedChars(syntheticAtoms, syntheticCatalog, 46, {
      練: "test allow-list entry",
      習: "test allow-list entry",
    });
    expect(withAllowlist).toHaveLength(0);
  });

  it("maxLiveModuleFromCurriculum finds a real, non-trivial module ceiling", () => {
    // A floor, not a pin — this MUST rise as modules land (currently 46;
    // see docs/ja-authoring-next memory) and this test must never need a
    // manual bump to stay green for that reason alone.
    expect(maxLiveModuleFromCurriculum()).toBeGreaterThanOrEqual(46);
  });

  it("isLiveModule excludes 'future' and forward-attributed tags with no curriculum file yet", () => {
    const ceiling = maxLiveModuleFromCurriculum();
    expect(isLiveModule("future", ceiling)).toBe(false);
    expect(isLiveModule("m49", ceiling)).toBe(false); // no m49-neo.ts exists yet
    expect(isLiveModule("m50", ceiling)).toBe(false);
    expect(isLiveModule("thr-n4", ceiling)).toBe(false);
    expect(isLiveModule("sidequest-survival", ceiling)).toBe(false);
    expect(isLiveModule("m1", ceiling)).toBe(true);
    expect(isLiveModule("m34", ceiling)).toBe(true);
  });

  it("the れんしゅうする/そうじする class stays fixed: both are fully catalogued today (no regression on the b28 B28B fix)", () => {
    const maxLiveModule = maxLiveModuleFromCurriculum();
    const violations = findUncataloguedChars(JA_COURSE_ATOMS, N5_KANJI, maxLiveModule, ALLOWED_UNCATALOGUED_CHARS);
    expect(violations.some((v) => v.atomId === "renshuusuru" || v.atomId === "soujisuru")).toBe(false);
  });

  it("the live uncatalogued-character backlog never grows past today's known ceiling (regression-classes C7 — lower this as debt is paid down, never raise it silently)", () => {
    const maxLiveModule = maxLiveModuleFromCurriculum();
    const checked = JA_COURSE_ATOMS.filter((a) => isLiveModule(a.fromModule, maxLiveModule) && !!a.kanji);
    // A floor, not a pin — proves the sweep is walking a real, non-trivial
    // population (C4: "assert the collection is non-empty before
    // asserting on its contents").
    expect(checked.length).toBeGreaterThan(100);

    const violations = findUncataloguedChars(JA_COURSE_ATOMS, N5_KANJI, maxLiveModule, ALLOWED_UNCATALOGUED_CHARS);

    if (violations.length > KNOWN_UNCATALOGUED_CEILING) {
      // Only print the NEW ones (beyond what the ceiling already budgets
      // for) — a 300-atom dump on every future failure would bury the
      // signal. Not exact (the ceiling doesn't track WHICH atoms it
      // covers, only a count), so this prints the tail of the full list,
      // which in practice is exactly where a newly-landed module's atoms
      // sort (later modules append later in JA_COURSE_ATOMS).
      const overBudget = violations.length - KNOWN_UNCATALOGUED_CEILING;
      const suspects = violations.slice(-Math.min(overBudget, 25));
      const lines = suspects
        .map((v) => `  ${v.atomId} (fromModule ${v.fromModule}): "${v.char}" in kanji token "${v.token}"`)
        .join("\n");
      expect.fail(
        `${violations.length} uncatalogued live kanji characters, ${overBudget} more than the known ` +
          `ceiling of ${KNOWN_UNCATALOGUED_CEILING} — a new module likely shipped kanji-bearing vocab ` +
          `N5_KANJI was never extended for (the #104/#110/#163/#173/#194 class). Add the missing ` +
          `character(s) to N5_KANJI (and regenerate src/shared/glyphs/data/kanji.json via ` +
          `scripts/build-kanjivg-data.mjs), or if truly permanent-kana-by-design, add to this file's ` +
          `ALLOWED_UNCATALOGUED_CHARS AND lower KNOWN_UNCATALOGUED_CEILING by the same amount. ` +
          `Likely-new suspects (tail of the violation list):\n${lines}`,
      );
    }
    // The other half of C7: the ceiling must not be stale-HIGH either — if
    // real debt has been paid down (N5_KANJI grew), this fails and says by
    // how much, prompting a lower pin rather than silently carrying slack.
    expect(
      violations.length,
      `KNOWN_UNCATALOGUED_CEILING (${KNOWN_UNCATALOGUED_CEILING}) is now higher than the real backlog ` +
        `(${violations.length}) — lower the ceiling to match (regression-classes C7: a ratchet only ` +
        `ever tightens).`,
    ).toBe(KNOWN_UNCATALOGUED_CEILING);
  });
});
