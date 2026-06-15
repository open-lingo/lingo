import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ATOMS_UNLOCKED_EVENT,
  getUnlockedAtomIds,
  isAtomUnlocked,
  mergeServerUnlockedAtomIds,
  unlockAtomIds,
  type AtomsUnlockedDetail,
} from "./unlockLessonAtoms";

const STORAGE_KEY = "lingo:unlocked-atoms";

describe("unlock atom server-backup channel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("dispatches lingo:atoms-unlocked with only the NEWLY-added ids", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["ja:a"]));
    const seen: string[][] = [];
    const handler = (e: Event) => {
      seen.push((e as CustomEvent<AtomsUnlockedDetail>).detail.atomIds);
    };
    window.addEventListener(ATOMS_UNLOCKED_EVENT, handler);

    // ja:a already present → only ja:b is new.
    const added = unlockAtomIds(["ja:a", "ja:b"]);

    window.removeEventListener(ATOMS_UNLOCKED_EVENT, handler);
    expect(added).toBe(1);
    expect(seen).toEqual([["ja:b"]]);
  });

  it("does not dispatch when nothing is new", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["ja:a"]));
    const handler = vi.fn();
    window.addEventListener(ATOMS_UNLOCKED_EVENT, handler);

    const added = unlockAtomIds(["ja:a"]);

    window.removeEventListener(ATOMS_UNLOCKED_EVENT, handler);
    expect(added).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("canonicalizes bare ids before dispatching", () => {
    let detail: string[] | null = null;
    const handler = (e: Event) => {
      detail = (e as CustomEvent<AtomsUnlockedDetail>).detail.atomIds;
    };
    window.addEventListener(ATOMS_UNLOCKED_EVENT, handler);

    unlockAtomIds(["bare"]);

    window.removeEventListener(ATOMS_UNLOCKED_EVENT, handler);
    expect(detail).toEqual(["ja:bare"]);
  });

  describe("mergeServerUnlockedAtomIds — hydrate restore", () => {
    it("restores the ladder from a server set into an empty local store", () => {
      // Simulate a fresh device / cleared storage.
      expect(getUnlockedAtomIds().size).toBe(0);

      const added = mergeServerUnlockedAtomIds(["ja:a", "ja:b", "ja:c"]);

      expect(added).toBe(3);
      expect(isAtomUnlocked("ja:a")).toBe(true);
      expect(isAtomUnlocked("ja:c")).toBe(true);
    });

    it("unions with the local set, never dropping local-only ids", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["ja:local-only", "ja:shared"]));

      const added = mergeServerUnlockedAtomIds(["ja:shared", "ja:server-only"]);

      // ja:shared already present locally → only ja:server-only is new.
      expect(added).toBe(1);
      const ids = getUnlockedAtomIds();
      expect(ids.has("ja:local-only")).toBe(true);
      expect(ids.has("ja:server-only")).toBe(true);
      expect(ids.has("ja:shared")).toBe(true);
    });

    it("does NOT dispatch a push event (server already has these ids)", () => {
      const handler = vi.fn();
      window.addEventListener(ATOMS_UNLOCKED_EVENT, handler);

      mergeServerUnlockedAtomIds(["ja:a"]);

      window.removeEventListener(ATOMS_UNLOCKED_EVENT, handler);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
