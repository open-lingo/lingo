import { test, expect, type Page } from "@playwright/test";

/**
 * Regression coverage for the partial-lesson resume flow.
 *
 * Bug we caught the hard way last cycle: tabbing between hiragana and katakana
 * mid-lesson made the lesson restart from step 0 even though the hub still
 * advertised "Continue lesson". The fix shipped three pieces — intro step
 * fires onComplete, trace step persists per-pass, full session steps stored
 * in localStorage keyed by `(lang, alphabet, section, mode)`. This spec pins
 * the contract: complete N steps in script A, navigate to script B, come
 * back to A, lesson MUST resume at step N (same step list, same idx).
 */

const ALPHABET_PARAMS =
  "alphabetTestPass=1&alphabetSkipReview=1&alphabetNoSymbolToSound=1";
const SESSION_KEY_PREFIX = "lingo_alphabet_session_";

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
      if (events[i].name === "view_step")
        return String(events[i].data.stepId ?? "");
    }
    return null;
  });
}

async function waitForStepId(
  page: Page,
  predicate: "any" | { not: string },
): Promise<string> {
  const handle = await page.waitForFunction(
    (pred) => {
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
          if (pred === "any") return id;
          if (typeof pred === "object" && pred.not !== id) return id;
          return null;
        }
      }
      return null;
    },
    predicate,
    { timeout: 10_000 },
  );
  return await handle.jsonValue();
}

async function advanceOneStep(page: Page, beforeId: string | null) {
  const continueBtn = page.getByRole("button", { name: "Continue", exact: true });
  await continueBtn.click();
  await waitForStepId(page, beforeId ? { not: beforeId } : "any");
}

async function readStoredSession(
  page: Page,
  alphabetId: string,
): Promise<{ currentStepIdx: number; stepIds: string[] } | null> {
  return await page.evaluate(
    ({ prefix, alphabetId }) => {
      const key = `${prefix}ja_${alphabetId}_default_learn`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as {
          currentStepIdx: number;
          steps: Array<{ id: string }>;
        };
        return {
          currentStepIdx: parsed.currentStepIdx,
          stepIds: parsed.steps.map((s) => s.id),
        };
      } catch {
        return null;
      }
    },
    { prefix: SESSION_KEY_PREFIX, alphabetId },
  );
}

test("resumes hiragana lesson after tabbing to katakana", async ({ page }) => {
  // 1) Start fresh on hiragana, advance through the section-info step and the
  //    first letter's intro step (two "Continue" clicks). After step 2 there
  //    should be a saved session at step idx 2.
  await page.goto(
    `/ja/practice/alphabet/hiragana/learn?${ALPHABET_PARAMS}`,
  );
  await clearAlphabetStorage(page);
  await page.reload();

  await waitForStepId(page, "any");
  let prev = await getLatestStepId(page);

  // Click Continue past 2 steps (info + first intro are both single-click).
  for (let i = 0; i < 2; i++) {
    await advanceOneStep(page, prev);
    prev = await getLatestStepId(page);
  }

  // The 3rd step is whatever came after the first letter's intro. Snapshot it.
  const snapshotStepId = prev;
  expect(snapshotStepId).toBeTruthy();

  const beforeLeave = await readStoredSession(page, "hiragana");
  expect(beforeLeave).not.toBeNull();
  expect(beforeLeave!.currentStepIdx).toBe(2);
  expect(beforeLeave!.stepIds[2]).toBe(snapshotStepId);

  // 2) Navigate away to katakana lesson. This unmounts AlphabetLessonPage.
  await page.goto(
    `/ja/practice/alphabet/katakana/learn?${ALPHABET_PARAMS}`,
  );
  await waitForStepId(page, "any");

  // 3) Return to hiragana. We MUST land at the same snapshotStepId. The
  //    storage key + restore-effect should hydrate `restoredSteps` and
  //    `currentStepIdx`, then the first view_step event fires for the
  //    resumed index.
  await page.goto(
    `/ja/practice/alphabet/hiragana/learn?${ALPHABET_PARAMS}`,
  );
  const resumedStepId = await waitForStepId(page, "any");
  expect(resumedStepId).toBe(snapshotStepId);

  // Sanity: the stored session is still at idx 2 (haven't advanced again).
  const afterReturn = await readStoredSession(page, "hiragana");
  expect(afterReturn).not.toBeNull();
  expect(afterReturn!.currentStepIdx).toBe(2);
  expect(afterReturn!.stepIds).toEqual(beforeLeave!.stepIds);
});
