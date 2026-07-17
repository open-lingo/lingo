import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";

/**
 * Applies the custom overlay scrollbar to the document (body) scroll.
 *
 * OverlayScrollbars keeps native scrolling and only replaces the *visible*
 * bar, so keyboard scroll, scroll anchoring, and momentum all survive — we
 * just get the themed pill instead of the OS/GTK bar with its arrow buttons.
 * Render once, high in the tree; it manages `document.body` directly and
 * renders no DOM of its own.
 */
export function BodyScrollbars() {
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
    // `cancel.body: null` overrides OS's default "skip the body when native
    // scrollbars are overlaid" guard, so the themed bar applies on every OS.
    initialize({ target: document.body, cancel: { body: null } });
  }, [initialize]);

  return null;
}
