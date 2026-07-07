import { describe, it, expect } from "vitest";
import { COMBO_MAP, combosForSelection, canExtendSelection } from "./comboForms";
import type { TrainerTypeId } from "./trainerRegistry";

const sel = (...tiles: TrainerTypeId[]) => new Set<TrainerTypeId>(tiles);

describe("combosForSelection", () => {
  it("returns every COMBO_MAP entry whose tiles are a subset of the selection", () => {
    // {ta, nai, tai} unlocks nai-past + tai-neg + tai-past + tai-neg-past.
    const forms = combosForSelection(sel("ta-form", "nai-form", "v-tai")).map((c) => c.form);
    expect([...forms].sort()).toEqual(
      ["nai-past", "tai-neg", "tai-past", "tai-neg-past"].sort(),
    );
  });

  it("requires ALL tiles of an entry to be present", () => {
    // {ta, nai} alone → only nai-past (tai-* need the v-tai tile).
    expect(combosForSelection(sel("ta-form", "nai-form")).map((c) => c.form)).toEqual([
      "nai-past",
    ]);
    // A single tile unlocks no combo.
    expect(combosForSelection(sel("nai-form"))).toEqual([]);
  });

  it("unlocks the masu stack only when the masu tile is selected", () => {
    expect(combosForSelection(sel("masu", "nai-form")).map((c) => c.form)).toEqual([
      "masu-neg",
    ]);
    expect(combosForSelection(sel("masu", "ta-form")).map((c) => c.form)).toEqual([
      "masu-past",
    ]);
    // {masu, nai, ta} also satisfies {ta, nai} → nai-past.
    expect(
      combosForSelection(sel("masu", "nai-form", "ta-form")).map((c) => c.form).sort(),
    ).toEqual(["masu-neg", "masu-past", "masu-past-neg", "nai-past"].sort());
  });

  it("unlocks the い-adjective stacks with the i-adj tile", () => {
    // い+た → かった (past).
    expect(combosForSelection(sel("i-adj-forms", "ta-form")).map((c) => c.form)).toEqual([
      "past",
    ]);
    // い+ない+た → くなかった; the selection also satisfies {ta, nai} → nai-past.
    expect(
      combosForSelection(sel("i-adj-forms", "nai-form", "ta-form"))
        .map((c) => c.form)
        .sort(),
    ).toEqual(["nai-past", "past", "past-negative"].sort());
  });

  it("every entry is single-category (verb combos drill verbs, i-adj combos drill adjectives)", () => {
    for (const entry of COMBO_MAP) {
      const hasAdjTile = entry.tiles.includes("i-adj-forms");
      expect(entry.category).toBe(hasAdjTile ? "i-adj" : "verb");
    }
    // No entry pairs the i-adj tile with masu/v-tai — those attach to verb stems only.
    expect(combosForSelection(sel("i-adj-forms", "masu"))).toEqual([]);
    expect(combosForSelection(sel("i-adj-forms", "v-tai"))).toEqual([]);
  });

  it("an empty selection unlocks nothing", () => {
    expect(combosForSelection(sel())).toEqual([]);
  });
});

describe("canExtendSelection (hub tile greying)", () => {
  const ALL: TrainerTypeId[] = ["te-form", "ta-form", "nai-form", "masu", "v-tai", "i-adj-forms"];

  it("an empty selection can add any tile (solo training)", () => {
    for (const id of ALL) expect(canExtendSelection(sel(), id)).toBe(true);
  });

  it("already-selected tiles stay clickable (deselect)", () => {
    expect(canExtendSelection(sel("te-form"), "te-form")).toBe(true);
  });

  it("て pairs with nothing — every other tile greys out", () => {
    for (const id of ALL.filter((x) => x !== "te-form")) {
      expect(canExtendSelection(sel("te-form"), id), id).toBe(false);
      // …and て greys when anything else is selected.
      expect(canExtendSelection(sel(id), "te-form"), `te after ${id}`).toBe(false);
    }
  });

  it("い pairs with た and ない (its stacks) but not ます・たい", () => {
    const s = sel("i-adj-forms");
    expect(canExtendSelection(s, "ta-form")).toBe(true);
    expect(canExtendSelection(s, "nai-form")).toBe(true); // via the い+ない+た triple
    expect(canExtendSelection(s, "masu")).toBe(false);
    expect(canExtendSelection(s, "v-tai")).toBe(false);
  });

  it("a grown selection keeps constraining — {ます, た} can add ない but not たい", () => {
    const s = sel("masu", "ta-form");
    expect(canExtendSelection(s, "nai-form")).toBe(true); // → ませんでした triple
    expect(canExtendSelection(s, "v-tai")).toBe(false); // no entry holds all three
    expect(canExtendSelection(s, "i-adj-forms")).toBe(false);
  });
});
