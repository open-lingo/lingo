/**
 * Mobile gate — touch devices must not text-select the app.
 *
 * THE BUG (Spencer, 2026-09-02): a long-press or drag on the phone selected
 * every word on screen. `src/index.css` suppressed tap-highlight and
 * overscroll but never `user-select` / `-webkit-touch-callout`. Desktop keeps
 * selection, so the rule is scoped to `(pointer: coarse)` and this spec
 * asserts BOTH directions: none when coarse, auto otherwise. Inputs keep
 * `text` so typed-answer steps still show a caret.
 */
import { test, expect } from "@playwright/test";
import { activeViewports } from "./_matrix";
import { gotoSeeded } from "./_seed";

const ROUTE = { path: "/ja/practice/flashcards/review", auth: true, lang: "ja" } as const;

for (const vp of activeViewports()) {
  test(`selection is off only for coarse pointers @ ${vp.name}`, async ({ page }) => {
    await gotoSeeded(page, ROUTE, vp);
    const probe = await page.evaluate(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const body = getComputedStyle(document.body);
      const input = document.createElement("input");
      document.body.appendChild(input);
      const inputSelect = getComputedStyle(input).userSelect;
      input.remove();
      return {
        coarse,
        bodySelect: body.userSelect,
        callout: body.getPropertyValue("-webkit-touch-callout"),
        inputSelect,
      };
    });
    if (probe.coarse) {
      expect(probe.bodySelect, "coarse pointer must not select body text").toBe("none");
      expect(probe.callout).toBe("none");
      expect(probe.inputSelect, "inputs stay selectable on touch").toBe("text");
    } else {
      expect(probe.bodySelect, "fine pointer keeps selection").not.toBe("none");
    }
  });
}
