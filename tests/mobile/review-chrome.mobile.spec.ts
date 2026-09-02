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
