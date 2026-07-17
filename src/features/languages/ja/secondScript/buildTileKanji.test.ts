/**
 * Build-tile kanji derivation (Spencer 2026-07-17 ruling) — gate order:
 * in-lesson (moduleIndex != null) → `resolveEligibleKanjiAtomId`
 * (homograph/eligibility) → rollout unlock module. Anything failing a
 * gate stays kana (null). Expectations are derived from the live rollout
 * catalog so a schedule move can't stale-fail these tests.
 */
import { describe, expect, it } from "vitest";
import { resolveBuildTileKanji } from "./buildTileKanji";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";
import { resolveEligibleKanjiAtomId } from "../grammarHelpers";
import { JA_COURSE_ATOMS } from "../courseAtoms";

// atomId → kana lookup for the round-trip test.
const atomIdKana = new Map(JA_COURSE_ATOMS.map((a) => [a.id, a.kana]));

/** A known-eligible tile word (店 — used by the match-pairs kanji tests). */
const MISE = "みせ";
const miseAtomId = resolveEligibleKanjiAtomId(MISE)!;
const miseEntry = KANJI_ELIGIBLE_ATOMS.get(miseAtomId)!;

describe("resolveBuildTileKanji", () => {
  it("unlocked at the lesson's module → kanji surface + kana reading + atomId", () => {
    expect(miseAtomId).toBeTruthy();
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule)).toEqual({
      surface: miseEntry.kanji,
      reading: MISE,
      atomId: miseAtomId,
    });
    // Later modules keep it unlocked.
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule + 5)).toEqual({
      surface: miseEntry.kanji,
      reading: MISE,
      atomId: miseAtomId,
    });
  });

  it("below the unlock module → null (kana as today)", () => {
    expect(resolveBuildTileKanji(MISE, miseEntry.unlockModule - 1)).toBeNull();
    expect(resolveBuildTileKanji(MISE, 1)).toBeNull();
  });

  it("outside a lesson (moduleIndex null) → null", () => {
    expect(resolveBuildTileKanji(MISE, null)).toBeNull();
  });

  it("homograph-ineligible kana stays kana at any module", () => {
    // はな = 花/鼻 (homograph), に = 二/particle (homograph + number),
    // した = 下/する-past (inflection collision) — all refused by the
    // shared resolver, so no module can kanji-fy them.
    for (const kana of ["はな", "に", "した"]) {
      expect(resolveEligibleKanjiAtomId(kana)).toBeUndefined();
      expect(resolveBuildTileKanji(kana, 99)).toBeNull();
    }
  });

  it("single-kana tiles (character-granularity content) never resolve", () => {
    // Character builds are excluded by the caller, but the derivation is
    // also structurally safe for their tiles: single kana are homographs /
    // non-atoms and never map to a kanji surface.
    for (const kana of ["あ", "い", "す", "ん"]) {
      expect(resolveBuildTileKanji(kana, 99)).toBeNull();
    }
  });

  it("every eligible-catalog word round-trips through the tile derivation at its unlock", () => {
    // Sanity over the whole catalog: for each eligible atom whose kana the
    // conservative resolver accepts, the tile derivation agrees with the
    // catalog surface at unlock and refuses one module earlier.
    let checked = 0;
    for (const [atomId, entry] of KANJI_ELIGIBLE_ATOMS) {
      const kana = atomIdKana.get(atomId);
      if (!kana || resolveEligibleKanjiAtomId(kana) !== atomId) continue;
      checked++;
      expect(resolveBuildTileKanji(kana, entry.unlockModule)).toEqual({
        surface: entry.kanji,
        reading: kana,
        atomId,
      });
      expect(resolveBuildTileKanji(kana, entry.unlockModule - 1)).toBeNull();
    }
    expect(checked).toBeGreaterThan(20); // the layer is live, not vacuous
  });
});
