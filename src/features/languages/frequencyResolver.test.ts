import { describe, it, expect } from "vitest";
import {
  getFrequencyAtoms,
  getFrequencyUnlockedAtomIds,
} from "./frequencyResolver";

describe("getFrequencyUnlockedAtomIds", () => {
  it("returns an empty set when the feature is disabled", () => {
    expect(getFrequencyUnlockedAtomIds("ja", 99, false).size).toBe(0);
    expect(getFrequencyUnlockedAtomIds("ko", 99, false).size).toBe(0);
  });

  it("unlocks exactly the atoms whose unlockModule <= reachedModule", () => {
    for (const lang of ["ja", "ko"] as const) {
      const atoms = getFrequencyAtoms(lang);
      const reached = 6;
      const unlocked = getFrequencyUnlockedAtomIds(lang, reached, true);
      const expected = atoms
        .filter((a) => a.unlockModule <= reached)
        .map((a) => a.id);
      expect([...unlocked].sort()).toEqual([...expected].sort());
      // every unlocked id genuinely gates at/under the reached module
      for (const a of atoms) {
        expect(unlocked.has(a.id)).toBe(a.unlockModule <= reached);
      }
    }
  });

  it("higher reached module yields a superset", () => {
    for (const lang of ["ja", "ko"] as const) {
      const low = getFrequencyUnlockedAtomIds(lang, 4, true);
      const high = getFrequencyUnlockedAtomIds(lang, 12, true);
      expect(high.size).toBeGreaterThanOrEqual(low.size);
      for (const id of low) expect(high.has(id)).toBe(true);
    }
  });

  it("module 3 unlocks only the earliest (rank <= wordsPerModule) bucket", () => {
    const unlocked = getFrequencyUnlockedAtomIds("ja", 3, true);
    for (const a of getFrequencyAtoms("ja")) {
      if (unlocked.has(a.id)) expect(a.unlockModule).toBe(3);
    }
    // and there is at least one such earliest-bucket word
    expect(unlocked.size).toBeGreaterThan(0);
  });

  it("returns [] for a language with no frequency registry", () => {
    expect(getFrequencyAtoms("es")).toEqual([]);
    expect(getFrequencyUnlockedAtomIds("es", 99, true).size).toBe(0);
  });
});
