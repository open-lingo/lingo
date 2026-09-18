/**
 * React binding for `kuroshiro.ts`'s dict-load status — the inline
 * "Downloading Japanese dictionary…" state the design doc calls for
 * (docs/dictionary-lazy-load-2026-09-18.md), shown on a speaking/typed
 * step when the CDN-lazy dictionary hasn't finished loading yet (the
 * prefetch triggered at module 1, `dictPrefetch.ts`, hasn't landed, or
 * this is a learner's very first JA speaking step before any prefetch had
 * a chance to run at all).
 *
 * Returns `false` for every non-CDN build (flag off, or no CDN base
 * configured) — `isDictFromCdn()` is a build-time-derived constant, so
 * this never flickers true then false; a caller can render nothing extra
 * for that case with zero layout cost.
 */
import { useSyncExternalStore } from "react";
import {
  getDictLoadStatus,
  isDictFromCdn,
  subscribeDictLoadStatus,
  type DictLoadStatus,
} from "./kuroshiro";

export function useDictDownloadState(): {
  status: DictLoadStatus;
  /** True only when the CDN path is active AND a fetch is in flight. */
  showDownloadingBanner: boolean;
} {
  const status = useSyncExternalStore(
    subscribeDictLoadStatus,
    getDictLoadStatus,
    getDictLoadStatus,
  );
  return {
    status,
    showDownloadingBanner: isDictFromCdn() && status === "loading",
  };
}
