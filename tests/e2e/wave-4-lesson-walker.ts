/**
 * Wave 4 — generic lesson-step walker.
 *
 * Shared helper for the Wave 4C persona Playwright tests (Maya / Devon /
 * Trevor / Edith). Each persona spec navigates to a lesson, then asks
 * this walker to advance through every step until completion. The
 * walker is intentionally tolerant — it auto-recognizes the common
 * step-view shapes by their button labels + landmark text, taps a
 * plausible answer, then clicks Continue.
 *
 * What this walker DOES handle:
 *   - info / grammar_rule / phrase_card cards — click "Continue"
 *   - multiple_choice / word_image_mcq / particle_cloze / sentence_mcq /
 *     listening_comprehension / self_explanation_mcq — tap first option,
 *     commit, click Continue
 *   - listening_build / build_sentence — tap each tile in order found,
 *     commit, Continue
 *   - match_pairs — tap pairs greedily (left, right, left, right, …)
 *   - speaking — click "Continue without passing" (the post-2-fail
 *     escape) OR "Continue anyway" if the persona has mic disabled
 *   - dialogue_listen — wait for audio cue, tap first option per
 *     question, Continue
 *   - row_test — tap-through items the same way
 *
 * What this walker does NOT do (deliberate — personas can layer):
 *   - assert correctness (tester accepts wrong answers, just walks)
 *   - measure timing (use Playwright's built-in timers per test)
 *   - track XP / streaks
 *
 * Personas can extend by attaching custom listeners (e.g., capture all
 * step IDs hit, screenshot at certain step types, time the dialogue
 * playback).
 */
import type { Page, Locator } from "@playwright/test";

export type WalkOptions = {
  /** Max steps to walk before bailing (safety stop). */
  maxSteps?: number;
  /** Pause between actions in ms. Higher = more human-like, slower. */
  stepPaceMs?: number;
  /** If true, capture a screenshot at each step. */
  screenshotEachStep?: boolean;
  /** Screenshot directory (only used if screenshotEachStep). */
  screenshotDir?: string;
  /** Console-error collector — populated as the walk proceeds. */
  consoleErrors?: string[];
};

export type WalkResult = {
  /** Total steps observed (one Continue / commit per step). */
  stepsObserved: number;
  /** True if the lesson reached its "Lesson Complete" / next-lesson surface. */
  completed: boolean;
  /** Step types observed (string union from button heuristics — best-effort). */
  stepTypesSeen: string[];
  /** Time taken in ms. */
  elapsedMs: number;
};

/**
 * Walk a lesson end-to-end, advancing through each step with a
 * plausible answer. Returns when LessonComplete surfaces or maxSteps
 * is hit.
 */
export async function walkLesson(
  page: Page,
  opts: WalkOptions = {},
): Promise<WalkResult> {
  const maxSteps = opts.maxSteps ?? 60;
  const pace = opts.stepPaceMs ?? 200;
  const start = Date.now();
  const stepTypesSeen: string[] = [];
  let stepsObserved = 0;

  // Prelude: dismiss cookie consent banner if present (blocks the
  // lesson UI from being interactable).
  for (const re of [/essential only/i, /accept all/i, /dismiss/i]) {
    const btn = page.getByRole("button", { name: re }).first();
    if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
      await btn.click().catch(() => undefined);
      await page.waitForTimeout(150);
      break;
    }
  }
  // Also: "Take me home" implies the lesson route errored. Bail early.
  const errorCta = page.getByRole("button", { name: /take me home/i });
  if (await errorCta.isVisible({ timeout: 200 }).catch(() => false)) {
    return {
      stepsObserved: 0,
      completed: false,
      stepTypesSeen: ["error-fallback"],
      elapsedMs: Date.now() - start,
    };
  }

  let lastStableUrl = "";
  let stuckCount = 0;
  for (let i = 0; i < maxSteps; i++) {
    // Lesson-complete surface: stop. Heuristic: "Lesson Complete" header,
    // "Next lesson" / "I'm done" buttons, or the LessonComplete component
    // text. Also: URL change off /lesson/.
    const completeMarkers = page.locator(
      "text=/lesson complete|next lesson|i'm done|nice work|drill what you missed/i",
    );
    if (await completeMarkers.first().isVisible({ timeout: 250 }).catch(() => false)) {
      return {
        stepsObserved,
        completed: true,
        stepTypesSeen,
        elapsedMs: Date.now() - start,
      };
    }

    // Identify step type lightly (for the report), then advance.
    const stepType = await detectStepType(page);
    if (stepType) stepTypesSeen.push(stepType);

    const advanced = await advanceCurrentStep(page, stepType);
    if (!advanced) {
      stuckCount++;
      if (stuckCount >= 3) {
        // eslint-disable-next-line no-console
        console.log(`[walker] STUCK after ${stepsObserved} steps. Last type=${stepType}. Visible buttons:`);
        const btns = await page.locator("button:visible").all();
        for (const b of btns.slice(0, 10)) {
          const t = (await b.textContent().catch(() => ""))?.slice(0, 40).trim() ?? "";
          const aria = await b.getAttribute("aria-label").catch(() => "");
          const enabled = await b.isEnabled().catch(() => false);
          // eslint-disable-next-line no-console
          console.log(`  - "${t}" aria="${aria}" enabled=${enabled}`);
        }
        break;
      }
      await page.waitForTimeout(300);
      continue;
    }
    stuckCount = 0;
    stepsObserved++;
    await page.waitForTimeout(pace);

    // Track url to detect post-lesson navigation.
    const currentUrl = page.url();
    if (currentUrl !== lastStableUrl && !currentUrl.includes("/lesson/")) {
      // Navigated off the lesson — count as completed.
      return {
        stepsObserved,
        completed: true,
        stepTypesSeen,
        elapsedMs: Date.now() - start,
      };
    }
    lastStableUrl = currentUrl;

    if (opts.screenshotEachStep && opts.screenshotDir) {
      await page
        .screenshot({
          path: `${opts.screenshotDir}/step-${String(i + 1).padStart(2, "0")}-${stepType ?? "unknown"}.png`,
          fullPage: false,
        })
        .catch(() => undefined);
    }
  }

  return {
    stepsObserved,
    completed: false,
    stepTypesSeen,
    elapsedMs: Date.now() - start,
  };
}

/** Best-effort step-type identifier via UNIQUE markers. Checks the most
 *  specific markers first; phrase_card is removed (too greedy — it
 *  matched everything). */
async function detectStepType(page: Page): Promise<string | null> {
  const checks: Array<{ name: string; loc: Locator }> = [
    { name: "dialogue_listen", loc: page.getByRole("button", { name: /replay dialogue/i }) },
    { name: "self_explanation_mcq", loc: page.locator("text=/you picked.*in:|why is.*correct/i") },
    { name: "speaking", loc: page.getByRole("button", { name: /tap to speak|continue without passing|i said it/i }) },
    { name: "translate", loc: page.locator("textarea").first() },
    { name: "match_pairs", loc: page.locator("text=/match each japanese/i") },
    { name: "listening_build", loc: page.locator("text=/listen and (build|assemble)/i") },
    { name: "build_sentence", loc: page.locator("text=/build the japanese|put it together/i") },
    { name: "particle_cloze", loc: page.locator("text=/which particle/i") },
    { name: "listening_comprehension", loc: page.locator("text=/what does this/i") },
    { name: "word_image_mcq", loc: page.locator("text=/tap the picture/i") },
    { name: "grammar_rule", loc: page.locator("text=/grammar rule|the rule:/i") },
    { name: "row_test", loc: page.locator("text=/mastery test/i") },
  ];
  for (const c of checks) {
    if (await c.loc.first().isVisible({ timeout: 100 }).catch(() => false)) {
      return c.name;
    }
  }
  return "unknown";
}

/** Try to advance the current step. Returns true if we clicked something
 *  meaningful. Strategy: try Continue FIRST (info/phrase_card/grammar_rule
 *  end here) — if it's enabled, just click it. Otherwise commit a step-
 *  specific action then try Continue again. */
async function advanceCurrentStep(page: Page, type: string | null): Promise<boolean> {
  // Lesson-internal Continue button — match against the actual visible
  // button text. The ContinueButton component renders "Continue" /
  // "I said it!" / "Got it" / "Check" depending on the step. Scope to
  // primary-3d-styled buttons to avoid the language selector / chrome.
  async function clickPrimary(): Promise<boolean> {
    // Primary lesson buttons are full-width inside the lesson card —
    // filter to .w-full buttons OR fall back to text matching.
    const primary = page
      .locator("button.w-full:visible:not([disabled])")
      .first();
    if (await primary.isVisible({ timeout: 100 }).catch(() => false)) {
      await primary.click().catch(() => undefined);
      return true;
    }
    // Fallback: text-based match for Continue / Got it / Check / Next.
    for (const re of [/^continue$/i, /^continue anyway$/i, /^got it/i, /^check$/i, /^next/i, /^i said it/i]) {
      const btn = page.getByRole("button", { name: re }).first();
      if (await btn.isVisible({ timeout: 100 }).catch(() => false)) {
        const enabled = await btn.isEnabled().catch(() => false);
        if (enabled) {
          await btn.click().catch(() => undefined);
          return true;
        }
      }
    }
    return false;
  }

  // Type-specific commit phase: get the step into a "can-Continue" state.
  if (type === "translate") {
    const input = page.locator("textarea").first();
    if (await input.isVisible({ timeout: 100 }).catch(() => false)) {
      await input.fill("わたし").catch(() => undefined);
      await page.waitForTimeout(100);
    }
  } else if (type === "speaking") {
    // Speaking persona-skips: try the explicit skip / fallback continue.
    for (const re of [/continue without passing/i, /skip this step/i, /continue anyway/i, /i said it/i]) {
      const btn = page.getByRole("button", { name: re }).first();
      if (await btn.isVisible({ timeout: 100 }).catch(() => false)) {
        await btn.click().catch(() => undefined);
        return true;
      }
    }
  } else if (type === "match_pairs") {
    // Tap source-side buttons (left grid). They live inside the lesson
    // card and are NOT .w-full. Greedy tap order completes the grid.
    const tiles = page.locator("main button:visible:not([disabled])").filter({
      hasNotText: /continue|check|next|play|hide romaji|show romaji|exit|account|theme|essential|accept/i,
    });
    const count = Math.min(await tiles.count(), 16);
    for (let i = 0; i < count; i++) {
      await tiles.nth(i).click({ timeout: 100 }).catch(() => undefined);
      await page.waitForTimeout(80);
    }
  } else if (
    type === "particle_cloze" ||
    type === "word_image_mcq" ||
    type === "listening_comprehension" ||
    type === "self_explanation_mcq" ||
    type === "dialogue_listen" ||
    type === "grammar_rule" || // grammarRule has examples + Continue
    type === "build_sentence" ||
    type === "listening_build"
  ) {
    // MCQ-style: tap first option inside the lesson card.
    const optionBtn = page
      .locator("main button:visible:not([disabled])")
      .filter({
        hasNotText: /continue|check|next|play|skip|retry|got it|keep trying|replay|i said|tap to speak|hide romaji|show romaji|exit|account|theme|essential|accept|select language|collapse|open theme/i,
      })
      .first();
    if (await optionBtn.isVisible({ timeout: 100 }).catch(() => false)) {
      await optionBtn.click().catch(() => undefined);
      await page.waitForTimeout(120);
    }
  }
  // info / phrase_card / unknown: skip commit, go straight to Continue.

  return clickPrimary();
}
