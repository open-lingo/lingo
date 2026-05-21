import { test, expect } from "@playwright/test";

test.describe("admin lesson editor", () => {
  test("list page renders with lessons", async ({ page }) => {
    await page.goto("/admin/content/lessons");
    await expect(page).toHaveURL(/\/admin\/content\/lessons$/);
    await expect(page.getByRole("heading", { name: /^Lessons$/ })).toBeVisible();
    // At least one row should exist (we ship JA + KO content).
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });

  test("editor opens for a known lesson", async ({ page }) => {
    // ja-m1-l1-1 ("intro") exists for both ja and ko.
    await page.goto("/admin/content/lessons/ja-m1-l1-1");
    await expect(page).toHaveURL(/\/admin\/content\/lessons\/ja-m1-l1-1$/);
    // Header should show the lesson id in the subline.
    await expect(page.getByText(/ja-m1-l1-1/).first()).toBeVisible({ timeout: 10_000 });
    // Inspector and Preview panes should both mount.
    await expect(page.getByText("Inspector", { exact: false })).toBeVisible();
    await expect(page.getByText("Preview", { exact: false })).toBeVisible();
  });

  test("step list scrolls beyond the viewport for long lessons", async ({ page }) => {
    // ja-m1-l1-1 has 30 steps. The list pane must scroll, not clip.
    await page.goto("/admin/content/lessons/ja-m1-l1-1");
    const stepList = page.getByTestId("lesson-step-list");
    await stepList.waitFor({ state: "visible", timeout: 10_000 });

    // The pane should be scrollable: scrollHeight should exceed clientHeight.
    const overflow = await stepList.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      childCount: el.children.length,
    }));
    expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);
    expect(overflow.childCount).toBe(30);

    // Scroll to the bottom and confirm we actually moved to the maximum.
    const after = await stepList.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      return {
        scrollTop: el.scrollTop,
        maxScrollTop: el.scrollHeight - el.clientHeight,
      };
    });
    expect(after.scrollTop).toBeGreaterThan(0);
    // Allow a 4px epsilon for sub-pixel rounding.
    expect(Math.abs(after.scrollTop - after.maxScrollTop)).toBeLessThan(4);
  });

  test("list is sortable by ordinal position", async ({ page }) => {
    await page.goto("/admin/content/lessons");
    // Default sort is ordinal asc — first data row should be ja-m1-l1-1 (vowels intro).
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.waitFor({ state: "visible", timeout: 10_000 });
    await expect(firstRow).toContainText("ja-m1-l1-1");
    // And the ordinal cell shows "1".
    const ordinalCell = firstRow.locator("td").first();
    await expect(ordinalCell).toContainText("1");
  });

  test("draft save round-trips through localStorage", async ({ page }) => {
    await page.goto("/admin/content/lessons/ja-m1-l1-1");
    // Find the Title input via its label.
    const titleInput = page
      .locator("label")
      .filter({ hasText: /^Title$/i })
      .locator("input")
      .first();
    await titleInput.waitFor({ state: "visible", timeout: 10_000 });
    const original = await titleInput.inputValue();
    const updated = original + " — edited";
    await titleInput.fill(updated);

    await page.getByRole("button", { name: /Save draft/i }).click();
    await expect(page.getByText(/draft saved/i)).toBeVisible();

    // Reload — draft should rehydrate.
    await page.reload();
    const after = await page
      .locator("label")
      .filter({ hasText: /^Title$/i })
      .locator("input")
      .first()
      .inputValue();
    expect(after).toBe(updated);

    // Cleanup: discard draft so this test is idempotent.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Discard draft/i }).click();
  });
});
