import { test, expect, type Page } from "@playwright/test";

/**
 * Pins the trace-step fail-escape contract:
 *   - Every Check shows a score (always visible feedback).
 *   - After two failures the Skip button appears.
 *   - Clicking Skip advances the lesson (next step, same letter not mastered).
 *
 * Uses `?alphabetTestFail=1` to short-circuit the comparator to a fixed fail,
 * symmetric with the existing `?alphabetTestPass=1` used by the happy-path
 * walker — no need to synthesize garbage pixels.
 */

const PARAMS = "alphabetTestFail=1&alphabetSkipReview=1&alphabetNoSymbolToSound=1";

async function clearAlphabetStorage(page: Page) {
  await page.evaluate(() => {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("lingo_alphabet_")) toDelete.push(k);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
  });
}

async function getLatestStepId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const events = (
      window as unknown as {
        __alphabetEvents__?: Array<{ name: string; data: Record<string, unknown> }>;
      }
    ).__alphabetEvents__;
    if (!events) return null;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].name === "view_step") return String(events[i].data.stepId ?? "");
    }
    return null;
  });
}

async function waitForStepIdChange(page: Page, prev: string): Promise<string> {
  const handle = await page.waitForFunction(
    (p) => {
      const events = (
        window as unknown as {
          __alphabetEvents__?: Array<{
            name: string;
            data: Record<string, unknown>;
          }>;
        }
      ).__alphabetEvents__;
      if (!events) return null;
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].name === "view_step") {
          const id = String(events[i].data.stepId ?? "");
          return id !== p ? id : null;
        }
      }
      return null;
    },
    prev,
    { timeout: 10_000 },
  );
  return await handle.jsonValue();
}

async function advancePastIntroToTrace(page: Page): Promise<string> {
  // Walk Continue clicks until we land on a trace step. Step IDs look like
  // `<prefix>-<symbol>-<idx>`; trace steps fire `view_step` with
  // `stepType: "symbol_trace"`.
  const continueBtn = page.getByRole("button", { name: "Continue", exact: true });
  for (let i = 0; i < 10; i++) {
    const latest = await page.evaluate(() => {
      const events = (
        window as unknown as {
          __alphabetEvents__?: Array<{
            name: string;
            data: Record<string, unknown>;
          }>;
        }
      ).__alphabetEvents__;
      if (!events) return null;
      for (let j = events.length - 1; j >= 0; j--) {
        if (events[j].name === "view_step") {
          return {
            id: String(events[j].data.stepId ?? ""),
            type: String(events[j].data.stepType ?? ""),
          };
        }
      }
      return null;
    });
    if (latest?.type === "symbol_trace") return latest.id;
    await continueBtn.click();
    await page.waitForTimeout(150);
  }
  throw new Error("never reached a symbol_trace step within 10 advances");
}

test("trace step: 2 fails surfaces Skip; click advances", async ({ page }) => {
  await page.goto(`/ja/practice/alphabet/hiragana/learn?${PARAMS}`);
  await clearAlphabetStorage(page);
  await page.reload();

  const traceStepId = await advancePastIntroToTrace(page);

  // Skip should NOT be visible before any failures.
  await expect(
    page.getByRole("button", { name: "Skip this letter", exact: true }),
  ).toHaveCount(0);

  const checkBtn = page.getByRole("button", { name: "Check", exact: true });

  // Fail #1: Check, expect "Try again — 42%", no Skip yet.
  await checkBtn.click();
  await expect(page.getByText(/Try again — 42%/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Skip this letter", exact: true }),
  ).toHaveCount(0);

  // Wait for the fade-out + clear before next Check (canvas is mid-fade).
  await page.waitForTimeout(900);

  // Fail #2: Skip surfaces.
  await checkBtn.click();
  await expect(
    page.getByRole("button", { name: "Skip this letter", exact: true }),
  ).toBeVisible();
  // Score still rendered.
  await expect(page.getByText(/Try again — 42%/)).toBeVisible();

  // Click Skip — lesson should advance (stepId changes).
  await page.getByRole("button", { name: "Skip this letter", exact: true }).click();
  const nextId = await waitForStepIdChange(page, traceStepId);
  expect(nextId).not.toBe(traceStepId);
});

test("trace step: score is shown on every check, not just fail", async ({ page }) => {
  // Use happy-path flag here so we see a pass-side score render.
  await page.goto(
    `/ja/practice/alphabet/hiragana/learn?alphabetTestPass=1&alphabetSkipReview=1&alphabetNoSymbolToSound=1`,
  );
  await clearAlphabetStorage(page);
  await page.reload();

  await advancePastIntroToTrace(page);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  // Either "Good shape — 100%" (intermediate pass) OR celebration → no score
  // (final pass). Both are valid; we just assert score format is *available*
  // somewhere on screen at least once on the pass path.
  await expect(page.getByText(/Good shape — 100%/)).toBeVisible({ timeout: 5_000 });
});
