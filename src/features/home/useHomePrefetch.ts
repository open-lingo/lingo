import { useEffect } from "react";

import {
  prefetchCommunity,
  prefetchLearn,
  prefetchShop,
  prefetchSocial,
} from "@/shared/utils/routePrefetch";

/**
 * Idle-time prefetch of the routes a Home visitor is most likely to hit
 * next. Fires the lazy() chunk imports while the user reads the hero,
 * so the click-through navigation is instant.
 *
 * Uses ``requestIdleCallback`` where supported, falling back to a short
 * ``setTimeout`` so older Safari still benefits. Each prefetch is
 * fire-and-forget — errors are swallowed inside the prefetch helpers.
 *
 * Kept as a hook (not inlined in HomePage) so the route-chunk surface
 * stays out of HomePage's busy render path. Touching this file is also
 * unlikely to conflict with the in-flight staleTime sweep on HomePage.
 */
export function useHomePrefetch(): void {
  useEffect(() => {
    const run = () => {
      prefetchLearn();
      prefetchSocial();
      prefetchCommunity();
      prefetchShop();
    };

    type IdleHandle = ReturnType<typeof setTimeout> | number;
    let handle: IdleHandle;

    const ric: typeof window.requestIdleCallback | undefined =
      typeof window !== "undefined" ? window.requestIdleCallback : undefined;
    const cic: typeof window.cancelIdleCallback | undefined =
      typeof window !== "undefined" ? window.cancelIdleCallback : undefined;

    if (typeof ric === "function") {
      handle = ric(run, { timeout: 2000 });
      return () => {
        if (typeof cic === "function") cic(handle as number);
      };
    }

    handle = setTimeout(run, 500);
    return () => clearTimeout(handle as ReturnType<typeof setTimeout>);
  }, []);
}
