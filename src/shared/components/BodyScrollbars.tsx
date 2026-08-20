import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { shouldUseNativeScroll } from "@/shared/platform/nativeScroll";

/**
 * Applies the custom overlay scrollbar to the document (body) scroll.
 *
 * OverlayScrollbars keeps native scrolling and only replaces the *visible*
 * bar, so keyboard scroll, scroll anchoring, and momentum all survive — we
 * just get the themed pill instead of the OS/GTK bar with its arrow buttons.
 * Render once, high in the tree; it manages `document.body` directly and
 * renders no DOM of its own.
 *
 * ⚠️ Skipped on touch surfaces (the native app / mobile web). Its `autoHide:
 * "leave"` never fires without a pointer to leave, so on a phone the pill sat
 * permanently painted down the right edge — the opposite of a native app,
 * which shows only the OS's transient indicator. On touch we mount nothing and
 * let WebKit's own fading indicator do the job (`shouldUseNativeScroll`).
 */
export function BodyScrollbars() {
  const nativeScroll = shouldUseNativeScroll();
  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: {
      scrollbars: {
        theme: "os-theme-lingo",
        autoHide: "leave",
        autoHideDelay: 500,
        autoHideSuspend: true,
      },
    },
  });

  useEffect(() => {
    if (nativeScroll) return;
    // `cancel.body: null` overrides OS's default "skip the body when native
    // scrollbars are overlaid" guard, so the themed bar applies on every OS.
    initialize({ target: document.body, cancel: { body: null } });
  }, [initialize, nativeScroll]);

  return null;
}
