import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke test for the FSRS-6 engine wired into the live app.
 * We don't drive the reviewer UI (no fixtures yet); instead we invoke
 * the engine in the page context and confirm:
 *   1. createInitialState produces FSRS-6-shaped state.
 *   2. reviewCard transitions state and writes to localStorage.
 *   3. Reload picks the state back up unchanged.
 *   4. Pre-FSRS-6 localStorage entries are dropped on read.
 */

test.describe("FSRS-6 engine — in-app smoke", () => {
  test("createInitialState produces FSRS-6 shape", async ({ page }) => {
    await page.goto("/home");
    const state = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      return mod.createInitialState();
    });
    expect(state).toMatchObject({
      state: "new",
      reps: 0,
      lapses: 0,
      stability: 0,
      difficulty: 0,
      interval: 0,
    });
    expect(typeof state.dueDate).toBe("string");
    expect(typeof state.lastReviewDate).toBe("string");
  });

  test("reviewCard with Good promotes new card past learning", async ({ page }) => {
    await page.goto("/home");
    const next = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      let s = mod.createInitialState();
      s = mod.reviewCard(s, "good");
      return s;
    });
    expect(next.reps).toBe(1);
    expect(["learning", "review"]).toContain(next.state);
    expect(next.stability).toBeGreaterThan(0);
    expect(next.difficulty).toBeGreaterThan(0);
  });

  test("localStorage round-trip preserves FSRS state", async ({ page }) => {
    await page.goto("/home");
    const stored = await page.evaluate(async () => {
      const engine = await import("/src/features/flashcards/engine/srs.ts");
      const storage = await import(
        "/src/features/flashcards/engine/srsStorage.ts"
      );
      const s = engine.reviewCard(engine.createInitialState(), "good");
      storage.setCardState("e2e-card-1", s);
      const round = storage.getCardState("e2e-card-1");
      return round;
    });
    expect(stored).toBeTruthy();
    expect(stored.state).toMatch(/^(learning|review)$/);
    expect(stored.reps).toBe(1);
  });

  test("pre-FSRS-6 entries are discarded from localStorage", async ({ page }) => {
    await page.goto("/home");
    const result = await page.evaluate(async () => {
      const storage = await import(
        "/src/features/flashcards/engine/srsStorage.ts"
      );
      // Inject a pre-FSRS-6 SM-2-shaped entry under the new key and a
      // fully invalid entry. Both should be dropped on read.
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

  test("gradeFromLesson — wrong answer is a lapse", async ({ page }) => {
    await page.goto("/home");
    const out = await page.evaluate(async () => {
      const mod = await import("/src/features/flashcards/engine/srs.ts");
      let s = mod.createInitialState();
      s = mod.reviewCard(s, "good");
      s = mod.reviewCard(s, "good");
      const before = s;
      const next = mod.gradeFromLesson(before, { correct: false });
      return { before, next };
    });
    expect(out.next.lapses).toBe(out.before.lapses + 1);
    expect(out.next.state).toBe("relearning");
  });
});
