import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { SERVER_SYNC_ENABLED } from "@/shared/auth/bypass";
import { IS_NATIVE } from "@/shared/platform/native";

/**
 * Push on the way out, pull on the way back in.
 *
 * b19 (founder, 2026-09-15): "I close the app on my phone and nothing
 * pushes, and I open a lesson and nothing pushes." The logs agreed — the
 * only POST trigger was `LessonProgressHydrate`'s 30s interval, which runs
 * only while the app is foregrounded, and iOS freezes a backgrounded webview
 * mid-timer. So the last lesson of a session waited for the next cold
 * launch, and returning to the app never pulled what the iPad had done.
 *
 * Three sources for the same two events:
 *   - `visibilitychange` — tab switch, app switcher, screen lock
 *   - `pagehide` — the only close event iOS Safari/WKWebView reliably fires
 *   - Capacitor `appStateChange` — the native signal, which arrives on
 *     backgrounding even when the webview never sees a DOM event
 *
 * All three land on the same debounced flush (`FLUSH_MIN_INTERVAL_MS`), so
 * overlapping triggers cost one POST, not three.
 *
 * The engine module is preloaded on mount rather than imported inside the
 * handler: a process being frozen will not wait for a dynamic import, and
 * `LessonProgressHydrate` already loads that same chunk.
 */
export function useAppLifecycleSync(): void {
  const { progress } = useApi();
  const queryClient = useQueryClient();

  useEffect(() => {
    // A bypass build has no server to push to.
    if (!SERVER_SYNC_ENABLED) return;

    let disposed = false;
    let engine: typeof import("./engine") | null = null;
    let removeAppState: (() => void) | undefined;

    const enginePromise = import("./engine");
    void enginePromise.then((mod) => {
      if (!disposed) engine = mod;
    });

    const runFlush = (mod: typeof import("./engine")): void => {
      if (mod.getLessonDirtyCount() === 0) return;
      void mod
        .flushLessonProgressToServer({
          // keepalive lets the POST outlive the webview being frozen or the
          // tab being closed (the client drops the flag for a body too big
          // for the 64 KB keepalive budget).
          batch: (payload) => progress.batchAttempts(payload, { keepalive: true }),
          // bulk-complete ops aren't marked keepalive: a stranded op is
          // already durable in the queue and gets retried on the next
          // launch/tick — no data at risk from letting it wait.
          bulkComplete: (payload) => progress.bulkComplete(payload),
        })
        .catch(() => {
          /* rows stay buffered + queued; next launch retries */
        });
    };

    const flush = (): void => {
      // Fast path once the chunk is in memory (the case that matters: the
      // app has been running). A hide inside the first few ms of mount
      // falls back to awaiting the import — best-effort, but better than
      // dropping the flush entirely.
      if (engine) {
        runFlush(engine);
        return;
      }
      void enginePromise.then((mod) => {
        if (!disposed) runFlush(mod);
      });
    };

    const resume = (): void => {
      // Refetching /progress/me re-runs the hydrate merge AND the build-20
      // local→server reconciliation inside it, which is what makes "finish
      // on the phone, pick up the iPad" work without a relaunch. The client
      // coalesces concurrent GETs, so a resume storm is still one request.
      void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") flush();
      else resume();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    if (IS_NATIVE) {
      void (async () => {
        try {
          const { App } = await import("@capacitor/app");
          const handle = await App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) resume();
            else flush();
          });
          if (disposed) void handle.remove();
          else removeAppState = () => void handle.remove();
        } catch {
          // No native bridge (web build, or the plugin failed to load) —
          // the DOM events above still cover tab hide / close.
        }
      })();
    }

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      removeAppState?.();
    };
  }, [progress, queryClient]);
}
