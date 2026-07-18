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

  // Seed with the real starting URL (NOT "") so the first successful step
  // doesn't register as "navigated away" before any real navigation.
  let lastStableUrl = page.url();
  let stuckCount = 0;
  // Progress fingerprint: `advanceCurrentStep` can report success even when
  // a step doesn't actually move on (its tap-then-continue fallback returns
  // true optimistically). To catch a real stall, compare a cheap snapshot
  // of the lesson surface (progress-bar width + step prompt) across
  // iterations — if it hasn't changed for several "advances", we're looping.
  let lastFingerprint = "";
  let sameFingerprintCount = 0;
  async function fingerprint(): Promise<string> {
    return page
      .evaluate(() => {
        const bar = document.querySelector<HTMLElement>(
          '[role="progressbar"], [style*="width"]',
        );
        const barW = bar?.style?.width ?? "";
        const heading =
          document.querySelector("main h1, main h2, main p")?.textContent?.slice(0, 60) ?? "";
        const opts = Array.from(document.querySelectorAll("main button"))
          .map((b) => (b.textContent || "").trim())
          .filter(Boolean)
          .slice(0, 4)
          .join("|");
        return `${barW}::${heading}::${opts}`;
      })
      .catch(() => "");
  }
  for (let i = 0; i < maxSteps; i++) {
    // Lesson-complete surface: stop. Heuristic: "Lesson Complete" header,
    // "Next lesson" / "I'm done" buttons, or the LessonComplete component
    // text. Also: URL change off /lessons/.
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

    const beforeFp = await fingerprint();
    const advanced = await advanceCurrentStep(page, stepType);

    // Stall detection: if the surface fingerprint is identical to the last
    // few iterations, the "advance" isn't really advancing — bail.
    const afterFp = await fingerprint();
    // Don't count a stall while a read gate is legitimately holding the same
    // surface — only a genuine no-progress loop should trip this.
    const gateHolding = await page
      .getByRole("button", { name: /reading…|reading\.\.\.|checking|loading/i })
      .first()
      .isVisible({ timeout: 30 })
      .catch(() => false);
    if (!gateHolding && afterFp && afterFp === lastFingerprint && afterFp === beforeFp) {
      sameFingerprintCount++;
      if (sameFingerprintCount >= 6) {
        // eslint-disable-next-line no-console
        console.log(`[walker] STALLED (no DOM change) after ${stepsObserved} steps. Last type=${stepType}.`);
        break;
      }
    } else {
      sameFingerprintCount = 0;
    }
    lastFingerprint = afterFp;

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

    // Track url to detect post-lesson navigation. The lesson route is
    // `/<lang>/learn/lessons/<id>` — completion navigates OFF it (back to
    // the learn map or the next lesson's URL). Only treat a change that
    // leaves the lessons surface entirely as "done"; a change to another
    // `/lessons/` URL is just the next-lesson chain.
    const currentUrl = page.url();
    if (currentUrl !== lastStableUrl && !currentUrl.includes("/lessons/")) {
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
    // The lesson primary CTA renders as "Continue" / "Got it" / "Check" /
    // "Next" / "I said it!" / "Continue anyway". Teach cards (info /
    // grammar_rule / phrase_card) gate it behind a word-count-scaled read
    // delay (up to ~5s), during which the button reads "Reading…" and is
    // DISABLED. So we poll (up to 7s) for a primary that is BOTH visible
    // and enabled — this naturally waits the read gate out, then clicks.
    //
    // Label-based match is more reliable than the `.w-full` + `:visible` +
    // `[disabled]` compound CSS (Playwright's custom `:visible` pseudo
    // combines unreliably with attribute selectors).
    const labels = [
      /^continue$/i,
      /^continue anyway$/i,
      /^got it/i,
      /^check$/i,
      /^next/i,
      /^i said it/i,
      /^i'?m done/i,
      /^finish/i,
    ];
    // One fast scan for an already-clickable primary; only if we detect a
    // read gate ("Reading…") do we poll (that gate is the ONLY thing worth
    // waiting on). Everything else returns immediately so MCQ steps don't
    // each burn a settle window — the caller taps an option and retries.
    async function scanOnce(): Promise<boolean> {
      for (const re of labels) {
        const btn = page.getByRole("button", { name: re }).first();
        if (!(await btn.isVisible({ timeout: 40 }).catch(() => false))) continue;
        if (await btn.isEnabled().catch(() => false)) {
          await btn.click().catch(() => undefined);
          return true;
        }
      }
      // Unlabeled full-width primary (icon/short label) — only if enabled.
      const wfull = page.locator("button.w-full").filter({ hasNotText: /reading/i });
      const n = Math.min(await wfull.count().catch(() => 0), 4);
      for (let i = 0; i < n; i++) {
        const b = wfull.nth(i);
        if (
          (await b.isVisible({ timeout: 40 }).catch(() => false)) &&
          (await b.isEnabled().catch(() => false))
        ) {
          await b.click().catch(() => undefined);
          return true;
        }
      }
      return false;
    }

    if (await scanOnce()) return true;
    // Read gate present? The button is DISABLED and reads "Reading…" /
    // "Checking…". Also give a brief settle window unconditionally to cover
    // the inter-step transition where the next primary hasn't rendered yet.
    const gate = page
      .getByRole("button", { name: /reading…|reading\.\.\.|checking|loading/i })
      .first();
    const gated = await gate.isVisible({ timeout: 50 }).catch(() => false);
    const deadline = Date.now() + (gated ? 6000 : 300);
    do {
      await page.waitForTimeout(120);
      if (await scanOnce()) return true;
    } while (Date.now() < deadline);
    return false;
  }

  // Un-automatable steps (kana/kanji stroke-order TRACE on a canvas) can't
  // be completed headlessly — no strokes to draw. They expose a "Skip this
  // letter" escape; take it so the walk continues. Checked first so we
  // never loop on a 0%-CHECK trace step.
  for (const re of [/skip this letter/i, /skip letter/i, /skip this character/i]) {
    const skip = page.getByRole("button", { name: re }).first();
    if (await skip.isVisible({ timeout: 80 }).catch(() => false)) {
      await skip.click().catch(() => undefined);
      return true;
    }
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
      const tile = tiles.nth(i);
      const txt = (await tile.textContent().catch(() => ""))?.trim() ?? "";
      if (!txt) continue; // skip icon-only chrome (Exit lesson / Account)
      await tile.click({ timeout: 100 }).catch(() => undefined);
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
    // MCQ-style: tap the first REAL option inside the lesson card. Must
    // skip icon-only chrome (Exit lesson / Account) — empty text slips past
    // the hasNotText filter, and tapping "Exit lesson" bails to the map.
    const opts = page
      .locator("main button:visible:not([disabled])")
      .filter({
        hasNotText: /continue|check|next|play|skip|retry|got it|keep trying|replay|i said|tap to speak|hide romaji|show romaji|exit|account|theme|essential|accept|select language|collapse|open theme/i,
      });
    const optCount = Math.min(await opts.count().catch(() => 0), 12);
    for (let i = 0; i < optCount; i++) {
      const o = opts.nth(i);
      const txt = (await o.textContent().catch(() => ""))?.trim() ?? "";
      if (!txt) continue; // icon-only chrome — never tap
      await o.click().catch(() => undefined);
      await page.waitForTimeout(120);
      break;
    }
  }
  // info / phrase_card: skip commit, go straight to Continue.

  if (await clickPrimary()) return true;

  // No primary CTA yet — likely an MCQ-style step we didn't classify
  // (e.g. a "which kana did you hear" pick). Tap a plausible in-card
  // option, then retry the primary. Many such steps reveal Continue only
  // after a selection; some auto-advance on tap, so a fresh tap counts as
  // progress on its own.
  // IMPORTANT: icon-only chrome (Exit lesson, Account menu, Play) has empty
  // text, so a `hasNotText` filter can't exclude it — a naive `.first()`
  // could click "Exit lesson" and bail the whole lesson to the map. So we
  // iterate and require the candidate to have real, non-chrome text.
  const candidates = page
    .locator("main button:visible:not([disabled])")
    .filter({
      hasNotText:
        /continue|check|next|play|skip|retry|got it|keep trying|replay|i said|tap to speak|hide romaji|show romaji|exit|account|theme|essential|accept|select language|collapse|open theme/i,
    });
  const count = Math.min(await candidates.count().catch(() => 0), 12);
  for (let i = 0; i < count; i++) {
    const cand = candidates.nth(i);
    const txt = (await cand.textContent().catch(() => ""))?.trim() ?? "";
    if (!txt) continue; // icon-only chrome (exit/menu) — never tap it
    await cand.click().catch(() => undefined);
    await page.waitForTimeout(200);
    return (await clickPrimary()) || true;
  }

  return false;
}
