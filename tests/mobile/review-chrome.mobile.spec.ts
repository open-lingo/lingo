/**
 * Mobile gate — the review session's chrome is viewport-dependent.
 *
 * Decision 2 (Spencer, 2026-09-02): below `md` the flashcard review session
 * hides the app header, the practice breadcrumbs and the bottom tab bar;
 * at `md` and above it keeps all three. That "and above" half is the one this
 * spec exists for — a focused-flow regex is trivially easy to widen by accident
 * and nothing else in the suite would notice desktop losing its header.
 *
 * The breadcrumb nav's accessible name is "Practice location"
 * (`practice.hub.breadcrumbsAria` in en.json) — not the word "breadcrumb" —
 * confirmed by reading `PracticeBreadcrumbs.tsx` rather than guessing.
 */
import { test, expect } from "@playwright/test";
import { gotoSeeded } from "./_seed";
import { VIEWPORTS } from "./routes.mjs";

const ROUTE = {
  path: "/ja/practice/flashcards/review",
  auth: true,
  lang: "ja",
} as const;

const PHONE = VIEWPORTS.find((v) => v.name === "iphone-se")!;
const TABLET = VIEWPORTS.find((v) => v.name === "tablet-portrait")!;

test("hides header, breadcrumbs and tab bar below md", async ({ page }) => {
  await gotoSeeded(page, ROUTE, PHONE);
  await expect(page.locator("header").first()).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Practice location" }),
  ).toHaveCount(0);
  // The session must still offer a way out.
  await expect(
    page.getByRole("link", { name: /back to flashcards/i }),
  ).toBeVisible();
});

test("keeps the app chrome at md and above", async ({ page }) => {
  // tablet-portrait is 768px — exactly `md`, so `isMobile` is false here.
  await gotoSeeded(page, ROUTE, TABLET);
  await expect(page.locator("header").first()).toBeVisible();
});

/**
 * `FlashcardsInfoModal`'s footer (the CTA) must render OUTSIDE the body's
 * scroll region, not stacked on top of its tail end.
 *
 * `gotoSeeded` never marks onboarding seen, so a fresh review-route visit
 * auto-opens `FlashcardsInfoModal mode="onboarding"` — the same instance
 * whose CTA the safe-area gate measures. Scroll the body to its end and
 * assert the last section's bottom edge sits at or above the footer's top
 * edge: if `ModalBase`'s `fullHeight` scroll region and the footer sibling
 * ever regress back into one shared scroll container (e.g. a `sticky`
 * footer glued to the panel's own `overflow-y-auto`, which was tried and
 * reverted — it pinned an opaque footer over the last section instead),
 * this catches the overlap directly instead of relying on the safe-area
 * probe noticing only the off-screen-overflow symptom.
 */
test("info modal footer stays clear of the scrolled body content", async ({ page }) => {
  await gotoSeeded(page, ROUTE, PHONE);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/got it, let's start/i)).toBeVisible();

  const result = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]') as HTMLElement | null;
    const body = dlg?.querySelector<HTMLElement>(".overflow-y-auto") ?? null;
    if (!dlg || !body) return { found: false as const, lastBottom: null, footerTop: null };
    body.scrollTop = body.scrollHeight;
    const lastChild = body.lastElementChild as HTMLElement | null;
    const lastBottom = lastChild?.getBoundingClientRect().bottom ?? null;
    const footer = Array.from(dlg.querySelectorAll<HTMLElement>("div")).find(
      (d) => d.className.includes("shrink-0") && d.className.includes("border-t"),
    );
    const footerTop = footer?.getBoundingClientRect().top ?? null;
    return { found: true as const, lastBottom, footerTop };
  });

  expect(result.found, "expected the modal's scrollable body and footer to be present").toBe(
    true,
  );
  expect(result.lastBottom).not.toBeNull();
  expect(result.footerTop).not.toBeNull();
  // 1px EPS for sub-pixel rounding — same tolerance as the other DOM-geometry probes.
  expect(
    result.lastBottom!,
    `last body element bottom (${result.lastBottom}) overlaps the footer top (${result.footerTop})`,
  ).toBeLessThanOrEqual(result.footerTop! + 1);
});
