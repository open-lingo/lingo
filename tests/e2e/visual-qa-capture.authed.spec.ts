/**
 * GATE 10 — per-step screenshot capture.
 *
 * For each lesson in VISUAL_QA_LESSONS (comma-separated), reads the
 * contracts.json the vitest emitter wrote (run `npm run visual-qa:contracts`
 * FIRST with the same env), deep-links every step via the `?step=N` QA dial,
 * waits for the step stage to settle, and screenshots the step card into
 * `test-results/visual-qa/<lessonId>/step-<nnn>-<stepId>.png`.
 *
 * The crop is `[data-visual-qa="step-stage"]` (LessonPage) — the step card
 * only, no header/progress chrome, so pixel diffs and vision-model tokens
 * aren't spent on the shell. A capture-manifest.json pairs every PNG with
 * its contract index for the judge stage (scripts/visual-qa/judge-prompt.md).
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Playwright runs specs with cwd = repo root. NOT under test-results/ —
// Playwright clears that dir at every run start, which would delete the
// contracts the vitest emitter just wrote.
const OUT_ROOT = path.resolve(process.cwd(), "artifacts/visual-qa");
const LESSONS = (process.env.VISUAL_QA_LESSONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type Contract = {
  stepIndex: number;
  stepId: string;
  stepType: string;
};
type ContractSet = { lessonId: string; steps: Contract[] };

function loadContracts(lessonId: string): ContractSet {
  const p = path.join(OUT_ROOT, lessonId, "contracts.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      `No contracts.json for ${lessonId} — run \`npm run visual-qa:contracts\` with the same VISUAL_QA_LESSONS first.`,
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as ContractSet;
}

test.describe("@visual-qa per-step capture", () => {
  test.skip(LESSONS.length === 0, "VISUAL_QA_LESSONS not set");

  for (const lessonId of LESSONS) {
    test(`${lessonId}: capture every step`, async ({ page }) => {
      const contracts = loadContracts(lessonId);
      const dir = path.join(OUT_ROOT, lessonId);
      // CLEAN the dir first (2026-07-20): a re-capture after a lesson's
      // step composition changed left STALE PNGs with colliding step-index
      // filenames — a continuity judge read them as current content and
      // reported ~10 phantom OOV-distractor defects. Wipe before writing so
      // the dir only ever holds the current capture + manifest.
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      await page.setViewportSize({ width: 1280, height: 960 });
      // Pre-seed cookie consent — a fresh context otherwise shows the
      // GDPR banner, which bled into a tall dialogue capture and got
      // flagged by a judge (Gate 10 run 2026-07-20).
      await page.addInitScript(() => {
        localStorage.setItem(
          "open-lingo-cookie-consent",
          JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-07-20" }),
        );
      });
      // Long lessons at ~1.5-2.5s/step: give the whole loop room.
      test.setTimeout(30_000 + contracts.steps.length * 8_000);

      const manifest: {
        stepIndex: number;
        stepId: string;
        stepType: string;
        png: string;
      }[] = [];

      for (const c of contracts.steps) {
        await page.goto(
          `/ja/learn/lessons/${lessonId}?dev=1&step=${c.stepIndex}`,
        );
        const stage = page.locator(
          `[data-visual-qa="step-stage"][data-visual-qa-step-id="${c.stepId}"]`,
        );
        await expect(stage).toBeVisible({ timeout: 15_000 });
        // Settle: lazy fonts, ruby layout, entrance animations. A fixed
        // short wait beats animation-detection here — judging intermediate
        // states is the #1 vision-judge failure mode.
        await page.waitForTimeout(700);
        const png = `step-${String(c.stepIndex).padStart(3, "0")}-${c.stepId}.png`;
        // Stability guard (2026-07-17, two iterations): under parallel
        // workers the fixed settle wait raced BOTH the initial paint
        // (~2.8KB all-white PNGs) and the entrance ANIMATION (content
        // captured mid-slide → squeezed/clipped cards the judges then
        // flag). Neither a size check alone nor a longer fixed wait is
        // robust — so capture until two consecutive frames are IDENTICAL
        // and non-blank, bounded at ~4s extra.
        let shot = await stage.screenshot();
        for (let retry = 0; retry < 8; retry++) {
          await page.waitForTimeout(500);
          const next = await stage.screenshot();
          if (next.equals(shot) && next.byteLength >= 6_000) {
            shot = next;
            break;
          }
          shot = next;
        }
        fs.writeFileSync(path.join(dir, png), shot);
        manifest.push({
          stepIndex: c.stepIndex,
          stepId: c.stepId,
          stepType: c.stepType,
          png,
        });
      }

      fs.writeFileSync(
        path.join(dir, "capture-manifest.json"),
        JSON.stringify({ lessonId, capturedAt: "see-file-mtime", steps: manifest }, null, 2),
      );
      expect(manifest.length).toBe(contracts.steps.length);
    });
  }
});
