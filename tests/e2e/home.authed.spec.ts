import { test, expect } from "@playwright/test";

test.describe("authenticated home", () => {
  test("renders /home without bouncing to login", async ({ page }) => {
    await page.goto("/home");
    // If storage state is missing/expired, Auth0 will redirect us away —
    // assert the URL stuck at /home as the auth-still-valid signal.
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator("body")).not.toContainText(/redirecting to login/i);
  });
});
