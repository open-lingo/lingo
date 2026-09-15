import { useEffect, useState } from "react";
import { BREAKPOINTS } from "@/shared/hooks/breakpoints";

/**
 * Form-factor predicates — the ONE place that decides "is this viewport
 * phone-shaped, tablet-portrait, or a landscape desktop-mirror surface".
 *
 * Why this exists (iPad pass, `docs/ipad-scoping-2026-09-15.md` §2): several
 * surfaces used `hasCoarsePointer()` alone as a proxy for "this is a phone",
 * which is false on an iPad — a 1180×820 iPad landscape is a touch device that
 * Spencer wants rendering the DESKTOP layout. Touch-ness and shape are two
 * different questions and this module keeps them separate:
 *
 *   - `hasCoarsePointer()` (nativeScroll.ts) answers "does this input device
 *     need touch affordances" — scrollbars, tap targets, text selection. That
 *     one is correctly touch-only and is NOT re-expressed here.
 *   - these predicates answer "what SHAPE is this viewport" — which layout
 *     tree and which tile-token tier it should get.
 *
 * Product direction (Spencer 2026-09-15, binding): **landscape iPad mirrors
 * desktop** (sidebar, desktop tile tokens, slightly bigger tap targets);
 * **portrait iPad is the roomiest iteration of mobile** (mobile layout, mobile
 * tile tokens scaled up, no desktop sidebar).
 *
 * The query strings are exported so CSS and JS can never drift: `MQ.tabletPortrait`
 * is character-for-character the `@media` block in `src/index.css` that defines
 * the `tabletPortrait` tile-token tier, and `MQ.landscapeLg` is the
 * `landscapeLg` Tailwind screen from `hooks/breakpoints.ts`.
 */

/**
 * Media queries, as strings, shared with CSS.
 *
 * `tabletPortrait` has NO upper width bound, on purpose: `min-width: 640px`
 * already excludes every phone and `orientation: portrait` every landscape
 * iPad, so a `max-width` adds nothing — and the 1023px bound this carried
 * until 2026-09-15 actively created a gap, leaving a 13" iPad in portrait
 * (1024×1366 CSS px) on the DESKTOP tile tokens while its layout was mobile.
 * Every portrait touch surface ≥640px now gets the roomy-mobile tier, which
 * is what "portrait is the roomiest iteration of mobile" actually means.
 */
export const MQ = {
  coarsePointer: "(pointer: coarse)",
  portrait: "(orientation: portrait)",
  /** The roomy-mobile tile tier — must equal the `index.css` block exactly. */
  tabletPortrait: `(min-width: ${BREAKPOINTS.sm}px) and (orientation: portrait) and (pointer: coarse)`,
  /**
   * The desktop-mirror tier, NOT touch-gated — a 1280×720 laptop is landscape
   * and ≥1024, so every existing desktop browser matches this exactly the way
   * it matched `lg:` before. This is the `landscapeLg` Tailwind screen.
   */
  landscapeLg: `(min-width: ${BREAKPOINTS.lg}px) and (orientation: landscape)`,
  /** `landscapeLg` AND touch = Spencer's iPad-in-landscape mode specifically. */
  landscapeDesktopTouch: `(min-width: ${BREAKPOINTS.lg}px) and (orientation: landscape) and (pointer: coarse)`,
} as const;

/** SSR/happy-dom-safe `matchMedia`. Returns false when the API is absent. */
function matchesQuery(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia(query).matches;
  } catch {
    // A stub matchMedia that throws on an unknown query (some test doubles).
    return false;
  }
}

/**
 * ≥640 CSS px wide, portrait, touch — any iPad held upright (mini through
 * 13"), or any Split View pane taller than it is wide. Gets the mobile layout
 * with the scaled-up `tabletPortrait` tile tokens, and the VERTICAL learn map
 * (TransitLearnPage reads this directly).
 */
export function isTabletPortrait(): boolean {
  return matchesQuery(MQ.tabletPortrait);
}

/**
 * ≥1024 wide, landscape, touch — an iPad in landscape. Gets the DESKTOP
 * layout (sidebar, desktop tile tokens) plus the tap-target bump.
 */
export function isLandscapeDesktopTouch(): boolean {
  return matchesQuery(MQ.landscapeDesktopTouch);
}

/**
 * The `landscapeLg` screen itself — every real desktop monitor/laptop plus
 * landscape iPads. Mouse and touch alike; this is the "the desktop sidebar
 * belongs here" test.
 */
export function isLandscapeLg(): boolean {
  return matchesQuery(MQ.landscapeLg);
}

/**
 * Should the learn home force the vertical phone map (and drop the Path/List
 * toggle)?
 *
 * Touch AND *not* a landscape-desktop surface. Expressed as the complement of
 * `landscapeLg` rather than as `phone || tabletPortrait` on purpose — the
 * complement covers the cases a width test misses:
 *   - an iPhone in LANDSCAPE (844×390: coarse, landscape, but only 844 wide)
 *     is still a phone and still wants the map;
 *   - a Split View pane (678×820) is portrait → map;
 *   - a 13" iPad in portrait (1024×1366) is ≥1024 but portrait → map,
 *     which is what "portrait is the roomiest mobile" means.
 * Only full-screen landscape ≥1024 reaches the desktop learn home.
 */
export function shouldForceVerticalLearnMap(): boolean {
  return matchesQuery(MQ.coarsePointer) && !matchesQuery(MQ.landscapeLg);
}

export type FormFactor = {
  /** touch-primary input */
  coarsePointer: boolean;
  /** `MQ.tabletPortrait` — roomy-mobile tile tier */
  tabletPortrait: boolean;
  /** `MQ.landscapeLg` — the sidebar/desktop-mirror tier (mouse or touch) */
  landscapeLg: boolean;
  /** `MQ.landscapeDesktopTouch` — Spencer's iPad-landscape mode */
  landscapeDesktopTouch: boolean;
  /** see `shouldForceVerticalLearnMap` */
  forceVerticalLearnMap: boolean;
};

const FORM_FACTOR_QUERIES = [
  MQ.coarsePointer,
  MQ.tabletPortrait,
  MQ.landscapeLg,
  MQ.landscapeDesktopTouch,
] as const;

function readFormFactor(): FormFactor {
  const coarsePointer = matchesQuery(MQ.coarsePointer);
  const landscapeLg = matchesQuery(MQ.landscapeLg);
  return {
    coarsePointer,
    tabletPortrait: matchesQuery(MQ.tabletPortrait),
    landscapeLg,
    landscapeDesktopTouch: matchesQuery(MQ.landscapeDesktopTouch),
    forceVerticalLearnMap: coarsePointer && !landscapeLg,
  };
}

function sameFactor(a: FormFactor, b: FormFactor): boolean {
  return (
    a.coarsePointer === b.coarsePointer &&
    a.tabletPortrait === b.tabletPortrait &&
    a.landscapeLg === b.landscapeLg &&
    a.landscapeDesktopTouch === b.landscapeDesktopTouch &&
    a.forceVerticalLearnMap === b.forceVerticalLearnMap
  );
}

/**
 * Reactive form factor. An iPad ROTATES while the app is open — a one-shot
 * `matchMedia` read at mount would leave the learn home on the wrong tree
 * until the next navigation — so this subscribes to every query it reads and
 * re-renders on change.
 *
 * Uses one `useState` + one listener per query (not `useSyncExternalStore`)
 * to stay consistent with `useMediaQuery`, and seeds synchronously from
 * `matchMedia` so there is no first-paint flash in a real browser.
 */
export function useFormFactor(): FormFactor {
  const [factor, setFactor] = useState<FormFactor>(readFormFactor);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const onChange = () =>
      setFactor((prev) => {
        const next = readFormFactor();
        // Same values → return the previous object so a change event on one
        // query that did not actually flip anything costs no re-render.
        return sameFactor(prev, next) ? prev : next;
      });
    // Re-sync once on mount: the initializer ran before hydration in SSR-ish
    // environments, and a test double may have been swapped in since.
    onChange();
    const lists: MediaQueryList[] = [];
    for (const q of FORM_FACTOR_QUERIES) {
      try {
        const mql = window.matchMedia(q);
        mql.addEventListener("change", onChange);
        lists.push(mql);
      } catch {
        /* stub matchMedia without addEventListener — nothing to unsubscribe */
      }
    }
    return () => {
      for (const mql of lists) {
        try {
          mql.removeEventListener("change", onChange);
        } catch {
          /* ditto */
        }
      }
    };
  }, []);

  return factor;
}
