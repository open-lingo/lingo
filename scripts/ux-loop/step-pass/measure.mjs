// measure.mjs — the DOM ground-truth probe for the step-type UX pass.
//
// Computes real getBoundingClientRect geometry for the seven MEASURABLE kinds
// (see classify.mjs), device-faithfully (insets + touch on phones). This is the
// source of truth the vision model's quotes are judged against — the probe
// finds every defect independently; the model only corroborates or is refuted.
//
// Exported: seedAndGoto(ctx, route, vp), probeStep(page, vp), measureReflow(page).
// CLI: node measure.mjs <route> <viewport>  → prints the probe JSON.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { VIEWPORTS, DESKTOP_VIEWPORTS } from "../../../tests/mobile/routes.mjs";

const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";
const ALL_VP = [...VIEWPORTS, ...DESKTOP_VIEWPORTS];

export function findViewport(name) {
  const vp = ALL_VP.find((v) => v.name === name);
  if (!vp) throw new Error(`unknown viewport ${name}; known: ${ALL_VP.map((v) => v.name).join(", ")}`);
  return vp;
}

// A phone viewport carries insets + touch; desktop is a plain wide window.
export function isDesktop(vp) {
  return DESKTOP_VIEWPORTS.some((v) => v.name === vp.name);
}

export async function newSurface(browser, vp, lang = "ja") {
  const desktop = isDesktop(vp);
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: desktop ? 1 : 3,
    isMobile: !desktop,
    hasTouch: !desktop,
    ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  // Insets before first paint — env(safe-area-inset-*) is 0 in Chromium otherwise.
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: vp.insets });
  await page.addInitScript(
    ({ key, langId }) => {
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.learning = {
          learningLanguageId: langId,
          uiLocale: "en",
          showAlphabetRomanization: true,
          showAlphabetFurigana: true,
          showRomaji: true,
          ftueArcSeen: true,
        };
        window.localStorage.setItem(key, JSON.stringify(parsed));
        window.localStorage.setItem("learningLanguageId", langId);
        window.localStorage.setItem(`lingo_placement_dismissed_v2_${langId}`, "1");
        window.localStorage.setItem(
          "open-lingo-cookie-consent",
          JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }),
        );
        window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      } catch {}
    },
    { key: SETTINGS_KEY, langId: lang },
  );
  return { ctx, page };
}

export async function gotoStep(page, base, route) {
  const url = `${base}${route}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  // Lesson stage or any interactive content.
  await page
    .waitForSelector('[data-lesson-stage], a[href], button, [role="button"]', { timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(Number(process.env.WAIT_MS ?? 1400));
}

// The in-page geometry pass. Pure DOM; returns the shape classify expects.
export async function probeStep(page, vp) {
  return page.evaluate(
    ({ vw, vh, insets }) => {
      const TAP_MIN = 24; // WCAG 2.2 SC 2.5.8 (AA), CSS px
      const FLUSH = 1.5; // px: "touching" the edge
      const safe = { top: insets.top, right: vw - insets.right, bottom: vh - insets.bottom, left: insets.left };

      const label = (el) => {
        const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
        if (t) return t;
        const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
        return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
      };
      const visible = (el, r) => {
        if (r.width < 2 || r.height < 2) return false;
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
      };
      const isChip = (el) => {
        const cs = getComputedStyle(el);
        const hasBg = cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
        const hasBorder = parseFloat(cs.borderTopWidth) > 0;
        const rounded = parseFloat(cs.borderTopLeftRadius) > 0;
        return (hasBg || hasBorder) && rounded;
      };
      const clipAncestor = (el) => {
        let p = el.parentElement;
        while (p && p !== document.body) {
          const cs = getComputedStyle(p);
          if (/hidden|clip/.test(cs.overflowX + " " + cs.overflowY)) return p;
          p = p.parentElement;
        }
        return null;
      };

      const smallTapTargets = [];
      const edgeBleed = [];
      const clipped = [];
      const truncations = [];
      const seenEdge = new Set();

      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!visible(el, r)) continue;
        const cs = getComputedStyle(el);

        // tap targets
        const interactive = el.matches('button, a[href], [role="button"], input, select, [tabindex]:not([tabindex="-1"])');
        if (interactive && (r.width < TAP_MIN || r.height < TAP_MIN) && r.width > 0 && r.height > 0) {
          smallTapTargets.push({ label: label(el), w: Math.round(r.width), h: Math.round(r.height) });
        }

        // truncation: text clipped horizontally with no scroll affordance
        const scrollable = /auto|scroll/.test(cs.overflowX);
        if (!scrollable && el.scrollWidth - el.clientWidth > 4 && el.clientWidth > 0) {
          const ellipsis = cs.textOverflow === "ellipsis" || cs.overflowX === "hidden";
          if (ellipsis && (el.textContent || "").trim())
            truncations.push({ label: label(el), over: el.scrollWidth - el.clientWidth });
        }

        // clipped: part of the element sits outside its overflow-clipping ancestor
        const clip = clipAncestor(el);
        if (clip) {
          const cr = clip.getBoundingClientRect();
          const overBy = Math.round(Math.max(0, cr.top - r.top, r.bottom - cr.bottom, cr.left - r.left, r.right - cr.right));
          if (overBy >= 2 && r.height < vh * 0.9 && !scrollable)
            clipped.push({ label: label(el), overBy });
        }
        // clipped by the viewport top (under the notch/island) or off the right
        if (r.top < safe.top - 1 && r.bottom > 0 && r.height < vh * 0.5 && isChip(el)) {
          clipped.push({ label: label(el), overBy: Math.round(safe.top - r.top) });
        }

        // edge-bleed: a chip flush against a screen edge (not full-bleed by design)
        if (isChip(el) && r.width < vw * 0.92 && r.height < vh * 0.25) {
          const gaps = [
            ["top", r.top - safe.top],
            ["right", safe.right - r.right],
            ["bottom", safe.bottom - r.bottom],
            ["left", r.left - safe.left],
          ];
          for (const [edge, gap] of gaps) {
            if (gap >= -FLUSH && gap <= FLUSH) {
              const key = label(el) + edge;
              if (!seenEdge.has(key)) {
                seenEdge.add(key);
                edgeBleed.push({ label: label(el), gap: Math.round(gap), edge });
              }
            }
          }
        }
      }

      // stage overflow: the lesson scroller (parent of [data-lesson-stage])
      let stageOverflow = 0;
      const stage = document.querySelector("[data-lesson-stage]");
      if (stage) {
        const s = stage.parentElement ?? stage;
        stageOverflow = Math.max(0, s.scrollHeight - s.clientHeight);
      }
      // Did we actually land on a lesson step? A route that falls back to /home
      // (e.g. a course that isn't selectable yet) has no stage — its geometry is
      // some OTHER page and must never become a finding.
      const landed = !!stage;
      const seenType = stage?.getAttribute("data-visual-qa-step-type") ?? null;

      // primary CTA below the fold
      const cta =
        document.querySelector('[data-testid="primary-cta"]') ||
        [...document.querySelectorAll("button")].find((b) => /check|continue|got it|next|start|finish/i.test(b.textContent || ""));
      const ctaBelowFold = !!(cta && cta.getBoundingClientRect().bottom > vh + 1);

      // dedupe the noisy arrays (worst-first, cap)
      const cap = (arr, key, n = 8) => {
        const seen = new Set();
        return arr
          .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
          .filter((x) => { const k = x.label + (x.edge || ""); if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, n);
      };

      return {
        landed,
        seenType,
        smallTapTargets: cap(smallTapTargets, "w"),
        edgeBleed: cap(edgeBleed, "gap"),
        clipped: cap(clipped, "overBy"),
        truncations: cap(truncations, "over"),
        stageOverflow,
        ctaBelowFold,
      };
    },
    { vw: vp.width, vh: vp.height, insets: vp.insets },
  );
}

// reflow-on-submit: snapshot CTA + option rects, click the primary CTA once,
// re-snapshot, return the largest vertical move of any tracked element.
export async function measureReflow(page) {
  // Scroll-invariant: reset the stage scroller to top before EACH snapshot, so a
  // click that merely scrolls an overflowing step is not misread as a layout
  // reflow (match_pairs overflows 131px — that scroll is not a shift).
  const track = () =>
    page.evaluate(() => {
      const stage = document.querySelector("[data-lesson-stage]");
      const scroller = stage?.parentElement ?? stage;
      if (scroller) scroller.scrollTop = 0;
      const els = [
        document.querySelector('[data-testid="primary-cta"]'),
        ...document.querySelectorAll('[data-lesson-stage] button, [data-lesson-stage] [role="button"]'),
      ].filter(Boolean);
      return els.slice(0, 12).map((el) => {
        const r = el.getBoundingClientRect();
        return { k: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 20), top: Math.round(r.top), left: Math.round(r.left) };
      });
    });
  const before = await track();
  // ONLY the app's real primary CTA — never the answer tiles. Clicking a match
  // tile or an option is not a "submit", and measuring its shift is noise.
  const cta = page.locator('[data-testid="primary-cta"]').first();
  if (!(await cta.count()) || !(await cta.isEnabled().catch(() => false))) return 0;
  try {
    await cta.click({ timeout: 2500 });
    await page.waitForTimeout(450);
  } catch {
    return 0;
  }
  const after = await track();
  let maxMove = 0;
  for (const b of before) {
    const a = after.find((x) => x.k === b.k);
    if (a) maxMove = Math.max(maxMove, Math.abs(a.top - b.top));
  }
  return maxMove;
}

// ---- CLI ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
  const [route, vpName = "iphone-se"] = process.argv.slice(2);
  if (!route) { console.error("usage: node measure.mjs <route> [viewport]"); process.exit(1); }
  const vp = findViewport(vpName);
  const lang = /\/([a-z]{2})\/|lessons\/([a-z]{2})-/.exec(route)?.slice(1).find(Boolean) ?? "ja";
  const browser = await chromium.launch();
  const { page } = await newSurface(browser, vp, lang);
  await gotoStep(page, BASE, route);
  const probe = await probeStep(page, vp);
  const reflow = await measureReflow(page);
  console.log(JSON.stringify({ route, viewport: vpName, ...probe, reflowOnSubmit: reflow }, null, 2));
  await browser.close();
}
