/**
 * The marketing site's origin (landing, roadmap, docs, about, privacy, terms).
 *
 * Those pages moved out of this app into `open-lingo/lingo-landing` and are
 * served from the apex, while this app lives at `app.<domain>`. Anything that
 * used to link to an in-app `/landing`, `/about`, `/privacy` or `/terms` route
 * now leaves the origin, so it must be an `<a href>` / `window.location`
 * navigation — react-router cannot route across origins.
 *
 * `VITE_MARKETING_ORIGIN` is the source of truth (set as a repo variable on the
 * deploy workflow). The literal below is a last-resort fallback so a
 * misconfigured build degrades to a working link rather than navigating
 * nowhere; on a domain change, update the env var — this constant is the only
 * other place the host appears.
 */
const FALLBACK_ORIGIN = "https://openlingoapp.com";

export const MARKETING_ORIGIN = (
  (import.meta.env.VITE_MARKETING_ORIGIN as string | undefined)?.trim() ||
  FALLBACK_ORIGIN
).replace(/\/+$/, "");

/** Absolute URL on the marketing site. */
export function marketingUrl(path = "/"): string {
  return `${MARKETING_ORIGIN}/${path.replace(/^\/+/, "")}`;
}

/**
 * Leave the app for the marketing site. `replace` so the app page does not sit
 * in history behind it — a back button that lands on a page that immediately
 * bounces forward again is a trap.
 */
export function goToMarketing(path = "/"): void {
  window.location.replace(marketingUrl(path));
}
