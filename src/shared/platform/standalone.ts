/**
 * Is this document running as an INSTALLED app rather than a browser tab?
 *
 * Matters for exactly one reason, and it is the same trap the Capacitor
 * wrapper hit: an installed PWA that navigates cross-origin **breaks out of
 * the standalone context**. iOS drops the user into Safari; Android shows an
 * in-app browser bar. Anonymous users hit `MarketingRedirect`, which leaves for
 * the marketing origin — so a tester who installs the app, gets logged out, and
 * taps the icon is ejected from the app they just installed.
 *
 * Evaluated per call, not at module load: a page can be launched in a tab and
 * later added to the home screen, and `display-mode` is a live media query.
 *
 * Both checks are needed. `display-mode: standalone` is the standard and covers
 * Android/Chrome; `navigator.standalone` is Safari's non-standard predecessor
 * and is still the ONLY signal on iOS home-screen launches, which is the case
 * we most care about. Missing it means iOS testers keep getting ejected.
 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  if (iosStandalone === true) return true;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches
  );
}
