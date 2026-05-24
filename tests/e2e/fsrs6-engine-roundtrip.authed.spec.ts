import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke test for the FSRS-6 engine wired into the live app.
 * We don't drive the reviewer UI (no fixtures yet); instead we invoke
 * the engine in the page context and confirm:
 *   1. createInitialState produces FSRS-6-shaped state with both modalities.
 *   2. reviewCard transitions one modality and writes to localStorage.
 *   3. Reload picks the state back up unchanged.
 *   4. Pre-FSRS-6 SM-2 entries are dropped on read.
 *   5. Legacy flat FSRS-6 entries are upgraded to modal on read.
 *
 * Updated 2026-05-23 for the recognition/production modality split.
 */

test.describe("FSRS-6 engine — in-app smoke", () => {
  test("createInitialState produces modal FSRS-6 shape", async ({ page }) => {
    await page.goto("/home");
    const state = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      return mod.createInitialState();
    });
    // Modal shape: recognition + production sub-states.
    for (const sub of [state.recognition, state.production]) {
      expect(sub).toMatchObject({
        state: "new",
        reps: 0,
        lapses: 0,
        stability: 0,
        difficulty: 0,
        interval: 0,
      });
      expect(typeof sub.dueDate).toBe("string");
      expect(typeof sub.lastReviewDate).toBe("string");
    }
  });

  test("reviewCard with Good advances only the named modality", async ({ page }) => {
    await page.goto("/home");
    const next = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      let s = mod.createInitialState();
      s = mod.reviewCard(s, "recognition", "good");
      return s;
    });
    expect(next.recognition.reps).toBe(1);
    expect(["learning", "review"]).toContain(next.recognition.state);
    expect(next.recognition.stability).toBeGreaterThan(0);
    expect(next.recognition.difficulty).toBeGreaterThan(0);
    // Production untouched.
    expect(next.production.reps).toBe(0);
    expect(next.production.state).toBe("new");
  });

  test("localStorage round-trip preserves modal FSRS state", async ({ page }) => {
    await page.goto("/home");
    const stored = await page.evaluate(async () => {
      const engine = await import("/src/features/flashcards/engine/srs.ts");
      const storage = await import(
        "/src/features/flashcards/engine/srsStorage.ts"
      );
      const s = engine.reviewCard(
        engine.createInitialState(),
        "recognition",
        "good",
      );
      storage.setCardState("e2e-card-1", s);
      const round = storage.getCardState("e2e-card-1");
      return round;
    });
    expect(stored).toBeTruthy();
    expect(stored.recognition.state).toMatch(/^(learning|review)$/);
    expect(stored.recognition.reps).toBe(1);
    expect(stored.production.reps).toBe(0);
  });

  test("pre-FSRS-6 SM-2 entries are discarded from localStorage", async ({ page }) => {
    await page.goto("/home");
    const result = await page.evaluate(async () => {
      const storage = await import(
        "/src/features/flashcards/engine/srsStorage.ts"
      );
      // Inject a pre-FSRS-6 SM-2-shaped entry under the new key and a
      // fully invalid entry. Both should be dropped on read — SM-2 has
      // easeFactor/repetitions (no `stability`) so the legacy-flat
      // upgrade path rejects it.
      const legacy = {
        "old-card": {
          easeFactor: 2.5,
          interval: 5,
          dueDate: "2026-05-25",
          repetitions: 2,
          lastReviewDate: "2026-05-20",
        },
        "garbage-card": { foo: "bar" },
      };
      localStorage.setItem("open-lingo-srs:v2", JSON.stringify(legacy));
      return storage.getSRSStore();
    });
    expect(result).toEqual({});
  });

  test("legacy flat FSRS-6 entries are upgraded to modal on read", async ({ page }) => {
    await page.goto("/home");
    const result = await page.evaluate(async () => {
      const storage = await import(
        "/src/features/flashcards/engine/srsStorage.ts"
      );
      // Pre-modality flat FSRS-6 shape (what existing users have today).
      // Should be upgraded to modal with both sub-states copied from the
      // flat fields.
      const legacyFlat = {
        "upgrade-me": {
          stability: 2.5,
          difficulty: 4.1,
          state: "review",
          interval: 3,
          dueDate: "2026-06-01",
          lastReviewDate: "2026-05-28",
          reps: 1,
          lapses: 0,
          lastSyncedAt: "2026-05-28T00:00:00Z",
        },
      };
      localStorage.setItem("open-lingo-srs:v2", JSON.stringify(legacyFlat));
      return storage.getSRSStore();
    });
    expect(result["upgrade-me"]).toBeTruthy();
    expect(result["upgrade-me"].recognition.stability).toBe(2.5);
    expect(result["upgrade-me"].production.stability).toBe(2.5);
    expect(result["upgrade-me"].lastSyncedAt).toBe("2026-05-28T00:00:00Z");
  });

  test("gradeFromLesson(recognition, {correct:false}) writes a lapse on a mature card", async ({ page }) => {
    await page.goto("/home");
    const out = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      let s = mod.createInitialState();
      s = mod.reviewCard(s, "recognition", "good");
      s = mod.reviewCard(s, "recognition", "good");
      const before = s;
      const next = mod.gradeFromLesson(before, "recognition", { correct: false });
      return { before, next };
    });
    expect(out.next.recognition.lapses).toBe(out.before.recognition.lapses + 1);
    expect(out.next.recognition.state).toBe("relearning");
    // Production never touched.
    expect(out.next.production.reps).toBe(out.before.production.reps);
  });
});
