/*
 * Boot guard — the last line against a blank white screen (TestFlight #64,
 * build 11: "Doesn't return anything", pure white, no crash report).
 *
 * A classic script, deliberately outside the React bundle: it runs before the
 * module graph loads and keeps running if that graph never mounts (a throw at
 * module scope, a chunk that failed to fetch, a WKWebView content process that
 * died mid-load). CSP is `script-src 'self'` with no inline scripts, so this
 * lives in src/pub/ (Vite publicDir) rather than in index.html.
 *
 * What it does:
 *   1. Captures the first uncaught error / rejection that happens before React
 *      owns the page, so the fallback can show WHY.
 *   2. Watchdog: if `#root` is still empty after BOOT_TIMEOUT_MS, reload once
 *      (a transient failure heals silently); if it is STILL empty after that,
 *      paint an inline fallback with the captured error and a Reload button.
 *   3. Post-boot: if `#root` was populated and later becomes empty (React 19
 *      unmounts the whole root on an uncaught render error when no boundary
 *      catches it), paint the same fallback immediately — there is nothing
 *      else on screen to wait for.
 *   4. Removes the fallback the moment `#root` gains children again.
 *
 * Kept dependency-free and ES5-ish on purpose: it must run on any engine that
 * can show a white screen.
 */
(function () {
  "use strict";
  var doc = document;
  var host = location.hostname;
  // Capacitor serves the bundle from capacitor://localhost, so the hostname
  // test alone reads a phone as a dev box and the watchdog never reloads a
  // stuck native boot (seen on the Trap Phone, 2026-09-13). Native is decided
  // first and excludes dev.
  var isNativeScheme = location.protocol === "capacitor:" || location.protocol === "ionic:";
  var isLocalDev = !isNativeScheme && (host === "localhost" || host === "127.0.0.1" || host === "[::1]");
  // Native bundles load from capacitor://localhost — local, but NOT a dev server.
  var isNative = location.protocol === "capacitor:" || location.protocol === "ionic:";
  var BOOT_TIMEOUT_MS = isLocalDev && !isNative ? 20000 : 8000;
  var RELOAD_KEY = "lingo:boot-guard-reloaded-at";
  var RELOAD_WINDOW_MS = 60000;
  var state = { firstError: null, fallback: null, hadContent: false };
  window.__lingoBootGuard = state;
  // Every decision is echoed to the console so a device log (Capacitor forwards
  // console.* in debug builds) says what the guard saw — mounted-after-N-ms,
  // watchdog fired, fallback painted — instead of leaving a white screen mute.
  var t0 = Date.now();
  function log(msg) {
    try { console.info("[boot-guard] " + msg + " (+" + (Date.now() - t0) + "ms)"); } catch (_) { /* no console */ }
  }
  log("armed: timeout=" + BOOT_TIMEOUT_MS + "ms native=" + isNative + " localDev=" + isLocalDev);

  // Web fonts: index.html ships the Google Fonts CSS as a <link rel="preload">
  // so it can never block first paint or the scripts below it. Promote it to a
  // real stylesheet here (script-inserted stylesheets are non-blocking); until
  // it lands, display=swap shows the system fallback fonts.
  var fontsLink = doc.getElementById("lingo-fonts");
  if (fontsLink && fontsLink.getAttribute("rel") !== "stylesheet") {
    fontsLink.setAttribute("rel", "stylesheet");
  }

  function describe(err) {
    if (!err) return "";
    if (typeof err === "string") return err;
    var msg = err.message || String(err);
    return err.name && err.name !== "Error" ? err.name + ": " + msg : msg;
  }
  window.addEventListener("error", function (e) {
    if (state.firstError) return;
    state.firstError = describe(e.error || e.message);
    log("first error: " + state.firstError);
  });
  window.addEventListener("unhandledrejection", function (e) {
    if (state.firstError) return;
    state.firstError = describe(e.reason);
    log("first rejection: " + state.firstError);
  });

  function rootIsEmpty() {
    var root = doc.getElementById("root");
    return !root || root.childElementCount === 0;
  }

  function reloadedRecently() {
    try {
      var at = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      return Date.now() - at < RELOAD_WINDOW_MS;
    } catch (_) {
      return true; // no storage → never auto-reload (avoids a loop we cannot bound)
    }
  }
  function markReloaded() {
    try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch (_) { /* no storage */ }
  }

  function paintFallback(reason) {
    log("fallback painted: " + reason);
    if (state.fallback) return;
    var el = doc.createElement("div");
    el.id = "boot-fallback";
    el.setAttribute("role", "alert");
    el.setAttribute("data-reason", reason);
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px 24px;box-sizing:border-box;background:#f5f0e6;color:#2a2420;font:16px/1.4 -apple-system,'Instrument Sans',system-ui,sans-serif;text-align:center;padding-top:max(32px,env(safe-area-inset-top));padding-bottom:max(32px,env(safe-area-inset-bottom))";
    var title = doc.createElement("p");
    title.style.cssText = "margin:0;font-size:20px;font-weight:700";
    title.textContent = "Open Lingo didn’t start";
    var body = doc.createElement("p");
    body.style.cssText = "margin:0;max-width:22rem;color:#6b625b;font-size:14px";
    body.textContent = "Something stopped the app from loading. Reloading usually fixes it.";
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.textContent = "Reload";
    btn.style.cssText =
      "margin-top:6px;min-height:44px;padding:10px 28px;border:0;border-radius:12px;background:#a5321f;color:#fff;font:inherit;font-weight:700;letter-spacing:.02em;text-transform:uppercase";
    btn.onclick = function () { markReloaded(); location.reload(); };
    el.appendChild(title);
    el.appendChild(body);
    el.appendChild(btn);
    if (state.firstError) {
      var detail = doc.createElement("p");
      detail.style.cssText = "margin:10px 0 0;max-width:24rem;color:#8a7f76;font-size:12px;word-break:break-word";
      detail.textContent = state.firstError;
      el.appendChild(detail);
    }
    (doc.body || doc.documentElement).appendChild(el);
    state.fallback = el;
  }
  function clearFallback() {
    if (!state.fallback) return;
    if (state.fallback.parentNode) state.fallback.parentNode.removeChild(state.fallback);
    state.fallback = null;
  }

  function onTimeout() {
    if (!rootIsEmpty()) return;
    log("watchdog: #root still empty" + (!isLocalDev && !reloadedRecently() ? " -> reloading once" : " -> fallback"));
    if (!isLocalDev && !reloadedRecently()) {
      markReloaded();
      location.reload();
      return;
    }
    paintFallback("boot-timeout");
  }
  var timer = setTimeout(onTimeout, BOOT_TIMEOUT_MS);

  function watchRoot() {
    var root = doc.getElementById("root");
    if (!root || typeof MutationObserver === "undefined") return;
    new MutationObserver(function () {
      if (root.childElementCount > 0) {
        if (!state.hadContent) log("#root populated");
        state.hadContent = true;
        clearTimeout(timer);
        clearFallback();
      } else if (state.hadContent) {
        // Populated once, now empty: React tore the tree down (uncaught render
        // error) or the document is being replaced. A real navigation replaces
        // the whole document, so a fallback painted here dies with it.
        paintFallback("root-emptied");
      }
    }).observe(root, { childList: true });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", watchRoot);
  else watchRoot();

  // Coming back from the background with nothing on screen is the #64 shape
  // Capacitor's own content-process reload does not cover (it only fires on
  // termination); if the root is empty on return and React had content before,
  // the observer has already painted the fallback — this just re-checks the
  // pre-mount case, where the observer has nothing to compare against.
  doc.addEventListener("visibilitychange", function () {
    if (doc.visibilityState === "visible" && state.hadContent && rootIsEmpty()) paintFallback("resume-empty");
  });
})();
