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
  /** Which neighbour defeated the spacing exception, for the failure message. */
  blockedBy: string;
}

export interface TapTargetReport {
  /** Targets considered, after dropping nested + screen-reader-only nodes. */
  measured: number;
  /** Passed outright at >= 24x24 CSS px. */
  passSize: number;
  /** Undersized but cleared the spacing exception. */
  passSpacing: number;
  /** Undersized but inline, i.e. constrained by the line-height of its text. */
  inlineExempt: number;
  failures: TapTarget[];
}

export interface SafeAreaIntrusion {
  tag: string;
  cls: string;
  testid: string;
  text: string;
  /** Which band it entered. */
  band: "top" | "right" | "bottom" | "left";
  /** How far into the band, in px. */
  depth: number;
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
 * Assertion 3 — WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA.
 *
 * This measured a flat 44px floor until 2026-08-09, which is the wrong bar and
 * is why it could only ever be a non-failing WARN. 44x44 is Apple's HIG
 * recommendation and WCAG's Level AAA (SC 2.5.5). The AA criterion is 24x24
 * CSS px WITH A SPACING EXCEPTION, quoted verbatim:
 *
 *   "The size of the target for pointer inputs is at least 24 by 24 CSS
 *    pixels, except when — Spacing: Undersized targets (those less than 24 by
 *    24 CSS pixels) are positioned so that if a 24 CSS pixel diameter circle
 *    is centered on the bounding box of each, the circles do not intersect
 *    another target or the circle for another undersized target."
 *   https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
 *
 * The exception is the whole point: it is why a dense icon row of 36px
 * controls conforms while a cramped pair of 20px ones does not. Measuring
 * size alone reported 114 "offenders" across 19 routes where the criterion
 * finds none, which is how a gate trains people to ignore it.
 *
 * The Inline exception (a target inside a sentence, sized by its line-height)
 * is honoured but counted separately — it is a judgement call about whether
 * something is prose, and it should be visible in the report rather than
 * quietly folded into the pass count.
 */
export async function tapTargetReport(page: Page): Promise<TapTargetReport> {
  return page.evaluate(() => {
    const AA = 24;
    const SEL =
      'a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

    interface Cand {
      node: HTMLElement;
      rect: DOMRect;
      inline: boolean;
    }
    const cands: Cand[] = [];
    for (const node of Array.from(document.querySelectorAll<HTMLElement>(SEL))) {
      const style = window.getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (style.opacity === "0") continue;
      if (node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true") continue;

      // Screen-reader-only nodes are not pointer targets: the visible target is
      // the styled label or the skip-link's focus state. They are 1x1 clipped
      // boxes, and counting them produced the only "failure" in the 2026-08-09
      // sweep — a `sr-only` skip link "colliding" with the site header.
      const clipped =
        style.clip === "rect(0px, 0px, 0px, 0px)" ||
        style.clipPath === "inset(50%)" ||
        (style.position === "absolute" && node.classList.contains("sr-only"));
      if (clipped) continue;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      // A target nested inside another target is not a separate pointer target.
      const ancestor = node.parentElement?.closest<HTMLElement>(SEL);
      if (ancestor && ancestor !== node) continue;

      cands.push({ node, rect, inline: style.display === "inline" });
    }

    const cx = (r: DOMRect) => r.left + r.width / 2;
    const cy = (r: DOMRect) => r.top + r.height / 2;
    /** Distance from a point to a rect; 0 when the point is inside it. */
    const distToRect = (px: number, py: number, r: DOMRect) =>
      Math.hypot(
        Math.max(r.left - px, 0, px - r.right),
        Math.max(r.top - py, 0, py - r.bottom),
      );
    const describe = (n: HTMLElement) =>
      (n.getAttribute("data-testid") ||
        (n.textContent || "").trim() ||
        n.getAttribute("aria-label") ||
        n.tagName.toLowerCase()).slice(0, 24);

    const undersized = cands.filter((c) => c.rect.width < AA || c.rect.height < AA);
    const report = {
      measured: cands.length,
      passSize: 0,
      passSpacing: 0,
      inlineExempt: 0,
      failures: [] as Array<{
        tag: string;
        cls: string;
        testid: string;
        role: string;
        text: string;
        width: number;
        height: number;
        blockedBy: string;
      }>,
    };

    for (const c of cands) {
      if (c.rect.width >= AA && c.rect.height >= AA) {
        report.passSize++;
        continue;
      }
      if (c.inline) {
        report.inlineExempt++;
        continue;
      }
      const px = cx(c.rect);
      const py = cy(c.rect);
      let blockedBy = "";
      for (const other of cands) {
        if (other === c) continue;
        if (distToRect(px, py, other.rect) < AA / 2) {
          blockedBy = `overlaps target "${describe(other.node)}"`;
          break;
        }
      }
      if (!blockedBy) {
        for (const other of undersized) {
          if (other === c) continue;
          if (Math.hypot(px - cx(other.rect), py - cy(other.rect)) < AA) {
            blockedBy = `24px circle meets that of "${describe(other.node)}"`;
            break;
          }
        }
      }
      if (!blockedBy) {
        report.passSpacing++;
        continue;
      }
      const cls = typeof c.node.className === "string" ? c.node.className : "";
      report.failures.push({
        tag: c.node.tagName.toLowerCase(),
        cls: cls.slice(0, 100),
        testid: c.node.getAttribute("data-testid") || "",
        role: c.node.getAttribute("role") || "",
        text: (c.node.textContent || "").trim().slice(0, 40),
        width: Math.round(c.rect.width),
        height: Math.round(c.rect.height),
        blockedBy,
      });
    }
    return report;
  });
}

/**
 * Assertion 5 — nothing anchored sits inside a safe-area band.
 *
 * Only `fixed`/`sticky` chrome counts. Scrolling content passing under the
 * Dynamic Island is normal and is what `viewport-fit=cover` is for; a pinned
 * header, a bottom-anchored CTA, or a floating action button landing there is
 * the bug — that is exactly what the 2026-08-08 phone report was.
 *
 * Requires the caller to have set matching insets (`gotoSeeded` does), because
 * Chromium reports zero for `env(safe-area-inset-*)` otherwise and this probe
 * would find nothing at every viewport, forever.
 */
export async function safeAreaIntrusions(
  page: Page,
  insets: { top: number; right: number; bottom: number; left: number },
): Promise<SafeAreaIntrusion[]> {
  return page.evaluate(
    ({ ins, eps }) => {
      const SEL =
        'a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input:not([type="hidden"]), select, textarea';
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const out: Array<{
        tag: string;
        cls: string;
        testid: string;
        text: string;
        band: "top" | "right" | "bottom" | "left";
        depth: number;
      }> = [];

      for (const node of Array.from(document.querySelectorAll<HTMLElement>(SEL))) {
        const style = window.getComputedStyle(node);
        if (style.visibility === "hidden" || style.display === "none") continue;
        if (style.opacity === "0") continue;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        // Anchored = itself or an ancestor is fixed/sticky.
        let p: HTMLElement | null = node;
        let anchored = false;
        while (p && p !== document.body) {
          const pos = window.getComputedStyle(p).position;
          if (pos === "fixed" || pos === "sticky") {
            anchored = true;
            break;
          }
          p = p.parentElement;
        }
        if (!anchored) continue;

        const cls = typeof node.className === "string" ? node.className : "";
        const base = {
          tag: node.tagName.toLowerCase(),
          cls: cls.slice(0, 100),
          testid: node.getAttribute("data-testid") || "",
          text: (
            (node.textContent || "").trim() ||
            node.getAttribute("aria-label") ||
            ""
          ).slice(0, 40),
        };
        if (ins.top > 0 && rect.top < ins.top - eps) {
          out.push({ ...base, band: "top", depth: Math.round(ins.top - rect.top) });
        }
        if (ins.bottom > 0 && rect.bottom > vh - ins.bottom + eps) {
          out.push({
            ...base,
            band: "bottom",
            depth: Math.round(rect.bottom - (vh - ins.bottom)),
          });
        }
        if (ins.left > 0 && rect.left < ins.left - eps) {
          out.push({ ...base, band: "left", depth: Math.round(ins.left - rect.left) });
        }
        if (ins.right > 0 && rect.right > vw - ins.right + eps) {
          out.push({
            ...base,
            band: "right",
            depth: Math.round(rect.right - (vw - ins.right)),
          });
        }
      }
      return out;
    },
    { ins: insets, eps: EPS },
  );
}

/**
 * Assertion 4 — primary CTA within the initial viewport.
 * Looks up `[data-testid="primary-cta"]`. `present:false` when no VISIBLE CTA
 * exists — the markup prereq hasn't landed, OR every match is
 * `display:none`/`visibility:hidden`/zero-rect (the cta-fold spec
 * skips-with-annotation in that case). A hidden/zero-rect CTA must NOT count as
 * `inFold:true` — an all-zero rect trivially satisfies the in-fold inequality,
 * which would be a vacuous pass. If multiple CTAs match, the visible one is
 * measured (a hidden desktop/mobile variant alongside the real one is common).
 */
export async function ctaInFold(page: Page): Promise<CtaFoldResult> {
  return page.evaluate((eps) => {
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const absent: CtaFoldResult = {
      present: false,
      inFold: false,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      innerWidth,
      innerHeight,
    };
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="primary-cta"]'),
    );
    // Keep only genuinely-visible matches: rendered box (display/visibility) AND
    // a non-zero rect. A zero-area rect is treated as not-present, never in-fold.
    const visible = candidates.filter((node) => {
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (visible.length === 0) return absent;
    const el = visible[0];
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
