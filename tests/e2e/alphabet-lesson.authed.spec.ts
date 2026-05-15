import { test, expect, type Page } from "@playwright/test";

/**
 * Drives the full alphabet lesson flow end-to-end via the real UI.
 *
 * Strategy:
 *   - `?alphabetTestPass=1` makes the canvas comparators short-circuit to pass,
 *     so we never have to synthesize stroke pixels.
 *   - `?alphabetSkipReview=1` ensures determinism (no production-review round).
 *   - `?alphabetNoSymbolToSound=1` keeps the step list tight (skips the
 *     romanization MC sub-step we don't have audio for in CI).
 *   - We poll `window.__alphabetEvents__` for the latest `view_step` event to
 *     learn what step type is on screen, then drive it with role-based clicks.
 *
 * Per-test we wipe all `lingo_alphabet_*` localStorage entries so the lesson
 * builds from a clean slate (no letters already marked "mastered" from prior
 * runs / the seeded auth user).
 */

const ALPHABET_PARAMS =
  "alphabetTestPass=1&alphabetSkipReview=1&alphabetNoSymbolToSound=1";

type CurrentStep = { id: string; type: string };

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

async function getLatestStep(page: Page): Promise<CurrentStep | null> {
  return await page.evaluate(() => {
    const events = (window as unknown as {
      __alphabetEvents__?: Array<{ name: string; data: Record<string, unknown> }>;
    }).__alphabetEvents__;
    if (!events) return null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.name === "view_step") {
        return {
          id: String(e.data.stepId ?? ""),
          type: String(e.data.stepType ?? ""),
        };
      }
    }
    return null;
  });
}

async function waitForStepChange(
  page: Page,
  prevId: string | null,
): Promise<CurrentStep> {
  const handle = await page.waitForFunction(
    (prev) => {
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
        const e = events[i];
        if (e.name === "view_step") {
          const id = String(e.data.stepId ?? "");
          if (id !== prev) {
            return {
              id,
              type: String(e.data.stepType ?? ""),
            };
          }
          return null;
        }
      }
      return null;
    },
    prevId,
    { timeout: 10_000 },
  );
  return (await handle.jsonValue()) as CurrentStep;
}

async function sessionEnded(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const events = (
      window as unknown as {
        __alphabetEvents__?: Array<{ name: string }>;
      }
    ).__alphabetEvents__;
    if (!events) return false;
    return events.some((e) => e.name === "session_end");
  });
}

function extractSymbolFromStepId(stepId: string): string {
  // Step IDs follow `<prefix>-<symbol>-<index>`. Symbols may contain Latin
  // letters but never "-", so splitting on "-" and taking second-to-last is
  // safe even when prefix has a hyphen (e.g. "prodReview-symbol-0").
  const parts = stepId.split("-");
  if (parts.length < 3) throw new Error(`unparseable step id: ${stepId}`);
  return parts[parts.length - 2];
}

async function driveStep(page: Page, step: CurrentStep): Promise<void> {
  const checkBtn = page.getByRole("button", { name: "Check", exact: true });
  const continueBtn = page.getByRole("button", { name: "Continue", exact: true });

  switch (step.type) {
    case "info":
    case "symbol_intro":
      await continueBtn.click();
      return;

    case "symbol_trace": {
      // minCorrectAttempts is 2 by default; force-pass means each Check passes.
      await checkBtn.click();
      // After pass 1 the Check button re-renders with the same accessible
      // name; Playwright's actionability check will wait for it to be ready.
      await checkBtn.click();
      // Final pass triggers celebrate → Continue (1100ms transition).
      await continueBtn.click();
      return;
    }

    case "symbol_production": {
      // minCorrectAttempts: 1
      await checkBtn.click();
      await continueBtn.click();
      return;
    }

    case "symbol_recognition": {
      const symbol = extractSymbolFromStepId(step.id);
      await page
        .getByRole("button", { name: symbol, exact: true })
        .first()
        .click();
      await checkBtn.click();
      await continueBtn.click();
      return;
    }

    case "symbol_to_sound":
      throw new Error(
        "symbol_to_sound steps should be disabled by alphabetNoSymbolToSound=1",
      );

    default:
      throw new Error(`unhandled step type: ${step.type}`);
  }
}

async function walkLesson(page: Page, maxSteps: number): Promise<CurrentStep[]> {
  const visited: CurrentStep[] = [];
  let prevId: string | null = null;

  // First step: wait until any view_step fires.
  let step = await waitForStepChange(page, prevId);
  for (let i = 0; i < maxSteps; i++) {
    visited.push(step);
    await driveStep(page, step);

    if (await sessionEnded(page)) break;

    // Wait for the next view_step (id different from the one we just drove).
    try {
      step = await waitForStepChange(page, step.id);
      prevId = step.id;
    } catch {
      // Lesson finished or step did not advance — bail.
      break;
    }
  }
  return visited;
}

async function gotoLesson(page: Page, alphabetId: "hiragana" | "katakana") {
  await page.goto(`/ja/practice/alphabet/${alphabetId}/learn?${ALPHABET_PARAMS}`);
  await clearAlphabetStorage(page);
  // After clearing storage, reload to rebuild the lesson from clean state.
  await page.reload();
}

test.describe("alphabet lesson — end-to-end", () => {
  for (const alphabetId of ["hiragana", "katakana"] as const) {
    test(`walks the default ${alphabetId} learn session to completion`, async ({
      page,
    }) => {
      await gotoLesson(page, alphabetId);
      const visited = await walkLesson(page, 200);

      // We expect at least: 1 info step + 5 letters × (intro + trace + recog
      // + production) = ~21 steps. Loose lower bound to keep this resilient.
      expect(visited.length).toBeGreaterThanOrEqual(10);
      expect(await sessionEnded(page)).toBe(true);

      // Sanity: every step type observed should be on our known list. If a new
      // step type sneaks in, the walker would have thrown above — this is just
      // documentation of expected coverage.
      const seenTypes = new Set(visited.map((s) => s.type));
      for (const t of seenTypes) {
        expect([
          "info",
          "symbol_intro",
          "symbol_trace",
          "symbol_recognition",
          "symbol_production",
        ]).toContain(t);
      }
    });
  }
});
