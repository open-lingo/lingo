/**
 * Lazy-load Google Font stylesheets on demand.
 *
 * `index.html` ships with only the default font (system stack, no network)
 * and Noto Sans JP (used everywhere kana appears). All other display fonts
 * are loaded the first time the user picks them via the theme editor.
 *
 * Saves ~600-900 KB of font CSS+woff2 transfer on first paint, which
 * matters on slow / intermittent connections (Aisha v2 slow-connection
 * finding, 2026-05-17).
 */

const INJECTED_ATTR = "data-lazy-font-id";
const inflight = new Map<string, Promise<void>>();

/**
 * Google Fonts CSS URLs for each lazy-loadable font id. `display=swap`
 * is set on every URL so we get FOUT (text shown in fallback) rather
 * than FOIT (blank text) while the font streams in.
 *
 * `system` and `georgia` are local system fonts — no network needed.
 * Noto Sans JP is preloaded in `index.html`, not here.
 */
const FONT_URLS: Record<string, string> = {
  inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "open-sans":
    "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap",
  "source-sans":
    "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap",
  nunito:
    "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap",
  lora:
    "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  atkinson:
    "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;500;600;700&display=swap",
};

/**
 * Inject the Google Fonts stylesheet for `fontId` if it hasn't been
 * injected already. Returns a promise that resolves once the stylesheet
 * has finished loading (so the font is ready to use, mitigating FOUT).
 *
 * Idempotent — repeated calls for the same id return the same promise
 * and do not inject duplicate <link> tags.
 *
 * Fonts without a remote URL (system / georgia / default) resolve
 * immediately. Failures resolve rather than reject — the page should
 * stay functional even if the font CDN is down.
 */
export function loadFontFamily(fontId: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const url = FONT_URLS[fontId];
  if (!url) return Promise.resolve();

  const existing = inflight.get(fontId);
  if (existing) return existing;

  // Check DOM in case a previous mount already injected (StrictMode, HMR).
  const present = document.querySelector(
    `link[${INJECTED_ATTR}="${fontId}"]`
  ) as HTMLLinkElement | null;
  if (present) {
    const ready = Promise.resolve();
    inflight.set(fontId, ready);
    return ready;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute(INJECTED_ATTR, fontId);

  const promise = new Promise<void>((resolve) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });

  inflight.set(fontId, promise);
  document.head.appendChild(link);
  return promise;
}

/** Test helper — clears cached promises + injected <link>s. */
export function _resetFontLoaderForTests(): void {
  inflight.clear();
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(`link[${INJECTED_ATTR}]`)
    .forEach((el) => el.remove());
}
