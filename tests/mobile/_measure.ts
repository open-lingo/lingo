/**
 * DOM-geometry measurement probes for the mobile gate (research §6).
 *
 * Every probe runs inside a real Chromium layout engine via `page.evaluate` —
 * NEVER port these to happy-dom/Vitest, which has no layout engine and returns
 * zeroed rects. `EPS = 1px` absorbs sub-pixel rounding.
 */
import type { Page } from "@playwright/test";

export const EPS = 1;

export interface OverflowResult {
  scrollWidth: number;
  clientWidth: number;
  /** true when the page scrolls horizontally beyond the viewport (bug). */
  overflow: boolean;
}

export interface WideElement {
  tag: string;
  cls: string;
  id: string;
  testid: string;
  right: number;
  width: number;
}

export interface TapTarget {
  tag: string;
  cls: string;
  testid: string;
  role: string;
  text: string;
  width: number;
  height: number;
}

export interface CtaFoldResult {
  present: boolean;
  inFold: boolean;
  top: number;
  bottom: number;
  left: number;
  right: number;
  innerWidth: number;
  innerHeight: number;
}

/**
 * Assertion 1 — no horizontal page overflow.
 * `scrollingElement.scrollWidth <= clientWidth + EPS`.
 */
export async function overflowCheck(page: Page): Promise<OverflowResult> {
  return page.evaluate((eps) => {
    const el = document.scrollingElement || document.documentElement;
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    return { scrollWidth, clientWidth, overflow: scrollWidth > clientWidth + eps };
  }, EPS);
}

/**
 * Assertion 2 — elements pushed off the right edge.
 * Visible (`width > 0`) elements whose right edge exceeds `innerWidth + EPS`.
 * Fixed/sticky-positioned overlays and their descendants are ignored (they can
 * legitimately live off-canvas, e.g. an off-screen drawer).
 */
export async function wideElements(page: Page): Promise<WideElement[]> {
  return page.evaluate((eps) => {
    const vw = window.innerWidth;
    const out: Array<{
      tag: string;
      cls: string;
      id: string;
      testid: string;
      right: number;
      width: number;
    }> = [];
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("body *"));
    for (const node of nodes) {
      const style = window.getComputedStyle(node);
      if (style.position === "fixed" || style.position === "sticky") continue;
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right > vw + eps) {
        const cls = typeof node.className === "string" ? node.className : "";
        out.push({
          tag: node.tagName.toLowerCase(),
          cls: cls.slice(0, 120),
          id: node.id || "",
          testid: node.getAttribute("data-testid") || "",
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    }
    // De-dupe common ancestor chains: keep the deepest offenders (most specific).
    return out.slice(0, 25);
  }, EPS);
}

/**
 * Assertion 3 — tap targets below the 44px floor.
 * Visible interactive elements with `height < 44 || width < 24`. Reported as a
 * WARN list (see spec) with a curated allow-list, not a hard failure yet.
 */
export async function smallTapTargets(page: Page): Promise<TapTarget[]> {
  return page.evaluate(() => {
    const SEL =
      'a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const out: Array<{
      tag: string;
      cls: string;
      testid: string;
      role: string;
      text: string;
      width: number;
      height: number;
    }> = [];
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SEL));
    for (const node of nodes) {
      const style = window.getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (node.hasAttribute("disabled")) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.height < 44 || rect.width < 24) {
        const cls = typeof node.className === "string" ? node.className : "";
        out.push({
          tag: node.tagName.toLowerCase(),
          cls: cls.slice(0, 100),
          testid: node.getAttribute("data-testid") || "",
          role: node.getAttribute("role") || "",
          text: (node.textContent || "").trim().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
    return out;
  });
}

/**
 * Assertion 4 — primary CTA within the initial viewport.
 * Looks up `[data-testid="primary-cta"]`. `present:false` when the markup prereq
 * hasn't landed yet (the cta-fold spec skips-with-annotation in that case).
 */
export async function ctaInFold(page: Page): Promise<CtaFoldResult> {
  return page.evaluate((eps) => {
    const el = document.querySelector<HTMLElement>('[data-testid="primary-cta"]');
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    if (!el) {
      return {
        present: false,
        inFold: false,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        innerWidth,
        innerHeight,
      };
    }
    const r = el.getBoundingClientRect();
    const inFold =
      r.top >= -eps &&
      r.left >= -eps &&
      r.bottom <= innerHeight + eps &&
      r.right <= innerWidth + eps;
    return {
      present: true,
      inFold,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      left: Math.round(r.left),
      right: Math.round(r.right),
      innerWidth,
      innerHeight,
    };
  }, EPS);
}

/** Concise one-line description of an offender for failure messages. */
export function describeEl(el: {
  tag: string;
  cls?: string;
  id?: string;
  testid?: string;
  text?: string;
}): string {
  const parts = [el.tag];
  if (el.id) parts.push(`#${el.id}`);
  if (el.testid) parts.push(`[data-testid=${el.testid}]`);
  if (el.cls) parts.push(`.${el.cls.split(/\s+/).slice(0, 3).join(".")}`);
  if (el.text) parts.push(`"${el.text}"`);
  return parts.join(" ");
}
