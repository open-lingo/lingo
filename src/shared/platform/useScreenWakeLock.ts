import { useEffect, useRef, useState } from "react";
import { useFormFactor } from "./formFactor";

/**
 * Screen Wake Lock — keep the display awake while the app is being used in a
 * way the OS cannot detect.
 *
 * Why (iPad pass, docs/ipad-scoping-2026-09-15.md §2): Spencer will leave the
 * app open on an iPad in landscape all day and do one or two lesson steps at a
 * time. iPadOS has no idea he is reading a grammar card — there is no touch
 * input for tens of seconds — so the display dims and sleeps mid-step, and
 * every return costs an unlock. A held screen wake lock is the platform's
 * answer; `navigator.wakeLock` is available in WKWebView from iOS/iPadOS 16.4,
 * which is also this app's `IPHONEOS_DEPLOYMENT_TARGET`, so every device the
 * binary installs on either has it or silently no-ops.
 *
 * WHEN THE LOCK IS HELD — two independent reasons, either is enough:
 *   (a) `inSession` AND a coarse pointer: a lesson / placement test / test-out
 *       / grammar-review session is on screen on a TOUCH device. A phone
 *       sleeping mid-lesson is the same defect as an iPad doing it; a desktop
 *       mouse is excluded because a laptop lid/screen-saver policy is the
 *       user's business and a web page grabbing it unasked is rude.
 *   (b) `landscapeDesktopTouch`: a ≥1024px landscape touch surface — an iPad
 *       held sideways, Spencer's own always-on mode. Held on ANY route there,
 *       session or not, because "always on" is the whole ask.
 *
 * NEVER THROWS. Every path is feature-detected and every promise is caught:
 * `request()` rejects (not just no-ops) when the document is hidden, when the
 * page is in a background tab, on a low-battery policy, and on any browser
 * without the API. A rejected request must leave the app exactly as it was.
 *
 * RE-ACQUISITION. The OS releases the lock whenever the page stops being
 * visible — backgrounding the app, switching Safari tabs, Split View losing
 * focus — and it does NOT come back on its own. So this subscribes to
 * `visibilitychange` and re-requests on every return to `visible`, and drops
 * its own reference when hidden so the next return always re-requests rather
 * than trusting a stale sentinel.
 */

/**
 * Minimal structural types for the Wake Lock API. Declared locally rather than
 * relying on `lib.dom` — `WakeLockSentinel` is not in every TS DOM lib version
 * this repo may build against, and a local shape is also the honest one: we
 * only ever touch `released`, `release()` and the `release` event.
 */
type WakeLockSentinelLike = {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener?(type: "release", listener: () => void): void;
  removeEventListener?(type: "release", listener: () => void): void;
};

type WakeLockLike = {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
};

type NavigatorWithWakeLock = Navigator & { wakeLock?: WakeLockLike };

/** The API object, or null on any platform/context that does not expose it. */
function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === "undefined") return null;
  const wl = (navigator as NavigatorWithWakeLock).wakeLock;
  if (!wl || typeof wl.request !== "function") return null;
  return wl;
}

/** True when this browser exposes `navigator.wakeLock.request`. */
export function isScreenWakeLockSupported(): boolean {
  return getWakeLock() !== null;
}

export type ScreenWakeLockStatus = {
  /** The API exists on this platform. */
  supported: boolean;
  /** The policy above says the lock should be held right now. */
  wanted: boolean;
  /** A sentinel is actually held (false while hidden, or after a rejection). */
  held: boolean;
};

export type ScreenWakeLockOptions = {
  /**
   * A lesson / placement / test-out / review session is on screen. The app
   * shell passes `focusedFlow` (see `routes/focusedFlow.ts`), which is exactly
   * that set of routes.
   */
  inSession: boolean;
  /** Escape hatch for tests and for a future user setting. Default true. */
  enabled?: boolean;
};

export function useScreenWakeLock({
  inSession,
  enabled = true,
}: ScreenWakeLockOptions): ScreenWakeLockStatus {
  const { coarsePointer, landscapeDesktopTouch } = useFormFactor();
  const supported = isScreenWakeLockSupported();
  const wanted = enabled && ((inSession && coarsePointer) || landscapeDesktopTouch);

  const [held, setHeld] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!wanted) return;
    const wakeLock = getWakeLock();
    if (!wakeLock) return;
    if (typeof document === "undefined") return;

    // Guards the async gap: an effect can be torn down (route change, React
    // 19 strict-mode double-invoke) while `request()` is still in flight, and
    // the sentinel that lands after that must be released, not stored.
    let cancelled = false;

    const drop = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      setHeld(false);
      if (sentinel && !sentinel.released) {
        // `release()` rejects if the OS already took it back. Nothing to do.
        void Promise.resolve(sentinel.release()).catch(() => {});
      }
    };

    const acquire = async () => {
      if (cancelled) return;
      // A request while hidden REJECTS. Skip it; `visibilitychange` retries.
      if (document.visibilityState !== "visible") return;
      if (sentinelRef.current && !sentinelRef.current.released) return;
      try {
        const sentinel = await wakeLock.request("screen");
        if (cancelled) {
          void Promise.resolve(sentinel.release()).catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setHeld(true);
        // The OS can release it under us (battery saver, backgrounding on a
        // platform that does not fire visibilitychange first). Keep `held`
        // honest so a status readout never claims a lock we lost.
        sentinel.addEventListener?.("release", () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
            setHeld(false);
          }
        });
      } catch {
        // Unsupported, denied, hidden, battery policy — all the same to us.
        setHeld(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void acquire();
      } else {
        // The OS has already released it. Forget the sentinel so the next
        // return re-requests instead of short-circuiting on a stale one.
        sentinelRef.current = null;
        setHeld(false);
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      drop();
    };
  }, [wanted]);

  return { supported, wanted, held };
}
