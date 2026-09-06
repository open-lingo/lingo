/**
 * DEV-ONLY geometry probe for the iOS Simulator capture harness
 * (`scripts/ux-loop/sim-capture.mjs`). Capacitor forwards `console.log` to the
 * native log, so a `log stream` on the sim reads real-WebKit numbers that no
 * Chromium emulation reproduces (TestFlight 2026-09-05: a 125pt dead band under
 * the CTA on a 15 Pro Max that Playwright never showed).
 *
 * Armed by the `/__sim` seed page via `localStorage["lingo:sim-probe"]`.
 */
export function installSimProbe(): void {
  if (!import.meta.env.DEV) return;
  let armed = false;
  try { armed = localStorage.getItem("lingo:sim-probe") === "1"; } catch { /* no storage */ }
  if (!armed) return;
  const r = (el: Element | null) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
  };
  const tick = () => {
    const cs = getComputedStyle(document.documentElement);
    const stage = document.querySelector("[data-lesson-stage]");
    const scroller = stage?.parentElement ?? null;
    const shell = scroller?.parentElement ?? null;
    const out = {
      innerHeight: window.innerHeight,
      vv: window.visualViewport ? Math.round(window.visualViewport.height) : null,
      docH: document.documentElement.clientHeight,
      bodyScrollH: document.body.scrollHeight,
      cookieVar: cs.getPropertyValue("--cookie-consent-height") || null,
      main: r(document.querySelector("main")),
      shell: r(shell),
      scroller: scroller ? { ...r(scroller), scrollH: scroller.scrollHeight, clientH: scroller.clientHeight } : null,
      stage: r(stage),
      cta: r(document.querySelector('[data-testid="primary-cta"]')),
      tray: r(document.querySelector("[data-lesson-stage] .border-dashed")),
      // Every box in the step column, so the budget can be read line by line.
      kids: [...(stage?.firstElementChild?.firstElementChild?.children ?? [])].map((k) => ({
        cls: (k.getAttribute("class") ?? k.tagName).slice(0, 40),
        ...r(k),
      })),
      tiles: [...document.querySelectorAll("[data-lesson-stage] button")]
        .filter((b) => !b.closest('[data-testid="primary-cta"]'))
        .slice(0, 2)
        .map((b) => ({ h: Math.round(b.getBoundingClientRect().height), fs: getComputedStyle(b).fontSize })),
    };
    const body = JSON.stringify({ ...out, href: location.pathname + location.search, ua: navigator.userAgent.slice(0, 80) });
    console.log("SIMPROBE " + body);
    // Same-origin in the dev harness (the app is served by vite), so this lands
    // in vite.config.ts's `/__sim/report` → artifacts/ux-loop/sim-probe.jsonl.
    void fetch("/__sim/report", { method: "POST", headers: { "content-type": "application/json" }, body }).catch(() => {});
  };
  for (const ms of [3000, 5000, 7000, 9000, 12000]) window.setTimeout(tick, ms);
}
