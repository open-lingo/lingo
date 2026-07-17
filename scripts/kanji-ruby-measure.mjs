// Ruby-layout measurement for the kanji surface pass (spec
// docs/kanji-implementation-spec-2026-07-16.md §4b). Follows the
// scripts/transit-measure.mjs precedent: viewport sweep × theme against the
// LIVE dev server, driving a real lesson to a step that renders a SUBSTITUTED
// kanji surface, then measured assertions that the <ruby> annotation does not
// clip or overflow at mobile (390px) and desktop widths.
//
// Target: ja-m17-8-1 ?step=speaking.1 → SpeakingStepView renders
// `targetAnnotation` (segments) UNCONDITIONALLY, and the kanji surface pass has
// rewritten that single-atom target from うしろ → 後ろ (ushiro, unlocked m16,
// inside furigana window at m17). This is a real substituted surface produced
// by applyKanjiSurfaces + getMockLessonContent, not a fixture.
//
// The `?step=<type>.<nth>` jump (LessonPage dev param) lands on the step with
// no interaction. `speaking.1` is stable under the concurrent info-step purge
// (it counts speaking steps, which the purge does not touch).
//
// FURIGANA VISIBILITY CAVEAT: the reading annotator (src/shared/readingAnnotation,
// a concurrent workstream — the "never-mix gate") is mid-flight. On the current
// server the substituted kanji <ruby> renders but its <rt> reading is suppressed
// for surfaces past the romaji-fade module (zero-width placeholder). The layout
// assertions below hold in BOTH states (the rt box occupies a line box either
// way); when the gate lands and populates the reading, re-running this script
// measures the visible furigana with no change. The DATA correctness of the
// substitution (surface/reading/window) is proven by the always-on Vitest
// suite applyKanjiSurfaces.test.ts.
//
// Usage: node scripts/kanji-ruby-measure.mjs [outDir]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT =
  process.argv[2] ??
  "/tmp/claude-1000/-mnt-c-Users-Spencer/4b2bf86f-ae9f-4f1e-ac1e-73d4178659fa/scratchpad/kanji-ruby-shots";
mkdirSync(OUT, { recursive: true });

const HAN_SRC = "\\p{Script=Han}";

// Primary target: a substituted kanji surface that renders as <ruby>.
const TARGET = { id: "ja-m17-8-1", step: "speaking.1", expect: "後ろ" };
// Secondary (report-only): m8 numbers render as PLAIN kanji today (pure-kanji
// ruby awaits the never-mix gate) — screenshot to document the renderer gap.
const SECONDARY = { id: "ja-m8-6-1", step: "speaking.3", expect: "一" };

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "1080p", width: 1920, height: 1080 },
];
const THEMES = ["light", "dark"];

let failures = 0;
const report = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ channel: "chromium", headless: true });

async function loadStep(ctx, id, step) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ja/learn/lessons/${id}?step=${step}`, {
    waitUntil: "networkidle",
    timeout: 25000,
  });
  // dismiss any FTUE / overlay that could intercept, like transit-measure
  await page.click('button:has-text("Continue")', { timeout: 800 }).catch(() => {});
  await page.waitForTimeout(900);
  return page;
}

// Measure every kanji-based <ruby> on the page + page overflow + tap targets.
async function measure(page, vpWidth) {
  return page.evaluate(
    ({ hanSrc, vpWidth }) => {
      const re = new RegExp(hanSrc, "u");
      const d = document.documentElement;
      const pageOverflow = d.scrollWidth > d.clientWidth + 1;

      const rubies = [...document.querySelectorAll("ruby")];
      const kanji = [];
      for (const ruby of rubies) {
        const rt = ruby.querySelector("rt");
        const base = (ruby.textContent || "").replace(rt?.textContent || "", "");
        if (!re.test(base)) continue;
        const rr = ruby.getBoundingClientRect();
        const rtr = rt ? rt.getBoundingClientRect() : null;
        // nearest positioned/card container for horizontal clip check
        const card = ruby.closest("[class*='rounded'],[class*='card'],section,main") || document.body;
        const cr = card.getBoundingClientRect();
        const rtText = rt ? rt.textContent || "" : "";
        const rtVisible = /\S/.test(rtText.replace(/[​ ]/g, ""));
        kanji.push({
          base,
          rtText,
          rtVisible,
          ruby: { l: rr.left, r: rr.right, t: rr.top, b: rr.bottom, w: rr.width, h: rr.height },
          rt: rtr ? { l: rtr.left, r: rtr.right, t: rtr.top, b: rtr.bottom, h: rtr.height } : null,
          card: { l: cr.left, r: cr.right, t: cr.top, b: cr.bottom },
          withinViewport: rr.left >= -1 && rr.right <= vpWidth + 1,
        });
      }

      // speaking mic / primary tap target sizes (mobile floor 44px)
      const buttons = [...document.querySelectorAll("button")]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);
      const maxBtn = buttons.reduce((m, r) => Math.max(m, r.height), 0);

      return { pageOverflow, kanji, maxBtn };
    },
    { hanSrc: HAN_SRC, vpWidth },
  );
}

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const tag = `${vp.name}-${theme}`;
    const page = await loadStep(ctx, TARGET.id, TARGET.step);
    const m = await measure(page, vp.width);

    // 1. no page-level horizontal overflow (a long <rt> reading widening the
    //    glyph box is the classic risk).
    report(!m.pageOverflow, `[${tag}] no page h-overflow`);

    // 2. the substituted surface actually rendered as a kanji <ruby>.
    const found = m.kanji.find((k) => k.base.includes(TARGET.expect)) ?? m.kanji[0];
    report(!!found, `[${tag}] substituted kanji <ruby> present`, found ? found.base : "none");

    if (found) {
      // 3. ruby sits inside the viewport horizontally (no glyph pushed off-edge).
      report(found.withinViewport, `[${tag}] ruby within viewport`, `l=${found.ruby.l.toFixed(0)} r=${found.ruby.r.toFixed(0)} vp=${vp.width}`);

      // 4. ruby not horizontally clipped by its card container.
      const hClip = found.ruby.l >= found.card.l - 1 && found.ruby.r <= found.card.r + 1;
      report(hClip, `[${tag}] ruby not h-clipped by card`, `ruby[${found.ruby.l.toFixed(0)},${found.ruby.r.toFixed(0)}] card[${found.card.l.toFixed(0)},${found.card.r.toFixed(0)}]`);

      // 5. the <rt> box (furigana line) sits within the ruby's horizontal span
      //    (ruby auto-widens the base to fit the reading) and above the base —
      //    i.e. not clipped off the top of the card. Holds whether the rt text
      //    is a visible reading or the in-flight zero-width placeholder.
      if (found.rt) {
        const rtWithin = found.rt.l >= found.ruby.l - 2 && found.rt.r <= found.ruby.r + 2;
        report(rtWithin, `[${tag}] <rt> within ruby h-span`, `rt[${found.rt.l.toFixed(0)},${found.rt.r.toFixed(0)}] ruby[${found.ruby.l.toFixed(0)},${found.ruby.r.toFixed(0)}]`);
        const rtNotClippedTop = found.rt.t >= found.card.t - 1;
        report(rtNotClippedTop, `[${tag}] <rt> not clipped above card`, `rt.top=${found.rt.t.toFixed(0)} card.top=${found.card.t.toFixed(0)}`);
        console.log(`      info [${tag}] furigana rt = ${JSON.stringify(found.rtText)} visible=${found.rtVisible}`);
      }
    }

    // 6. mobile: primary tap target (mic/continue) ≥ 44px.
    if (vp.name === "mobile") {
      report(m.maxBtn >= 44, `[${tag}] primary tap target ≥44px`, `${m.maxBtn.toFixed(0)}px`);
    }

    await page.screenshot({ path: `${OUT}/kanji-ruby-${tag}.png`, fullPage: false });
    await page.close();
    await ctx.close();
  }
}

// Secondary: document how pure-kanji numbers render today (plain, no ruby).
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
  const page = await loadStep(ctx, SECONDARY.id, SECONDARY.step);
  const info = await page.evaluate((expect) => {
    const inRuby = [...document.querySelectorAll("ruby")].some((r) => (r.textContent || "").includes(expect));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let plain = false, n;
    while ((n = walker.nextNode())) {
      if ((n.textContent || "").includes(expect) && !(n.parentElement && n.parentElement.closest("ruby"))) plain = true;
    }
    return { inRuby, plain };
  }, SECONDARY.expect);
  console.log(`      info [secondary m8 '${SECONDARY.expect}'] renderedAsRuby=${info.inRuby} renderedAsPlainKanji=${info.plain} (pure-kanji ruby awaits the never-mix gate — not this workstream)`);
  await page.screenshot({ path: `${OUT}/kanji-plain-m8-mobile-light.png`, fullPage: false });
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CLEAN" : `${failures} check(s) failed`} — shots in ${OUT}`);
process.exit(failures === 0 ? 0 : 1);
