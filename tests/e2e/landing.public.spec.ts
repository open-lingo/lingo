import { test, expect } from "@playwright/test";

test.describe("public landing", () => {
  test("renders hero + primary CTAs for unauthenticated visitors", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Open Lingo/i);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Stop forgetting/i);
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /log\s*in/i })).toBeVisible();
  });
});
