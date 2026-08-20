import { IS_NATIVE } from "./native";

/**
 * True when a coarse pointer (touch) is the primary input — the Capacitor app
 * and mobile web. Touch platforms provide their own transient scroll indicator,
 * so a persistent painted scrollbar reads as un-native chrome.
 *
 * Runtime (not compile-time): a laptop with a touchscreen reports `fine` as its
 * primary pointer, so this correctly leaves desktop scrollbars alone.
 */
export function hasCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Whether to defer to the OS's native (transient) scrollbar instead of the
 * app's themed pill. True in the native wrapper or on any touch-primary
 * surface. Gates both the `BodyScrollbars` overlay mount and mirrors the
 * `@media (pointer: coarse)` CSS that hides the webkit bars.
 */
export function shouldUseNativeScroll(): boolean {
  return IS_NATIVE || hasCoarsePointer();
}
