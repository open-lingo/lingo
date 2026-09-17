import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";

export type AuthHandoffDirection = "opening" | "signing-in";

/** How long to wait before offering "Taking too long? Try again". */
const RETRY_DELAY_MS = 8000;

/**
 * Full-screen branded interstitial for both directions of the Auth0
 * handoff — replaces the old plain "Redirecting to login..." spinner.
 *
 * Same visual language as the app icon (see `scripts/generate-icons.mjs`):
 * a heavy "O" with "LINGO" running bottom-to-top beside it, white on the
 * fixed dark brand background (`--color-auth-handoff-*`, styles/tokens.css)
 * — so this reads as part of the app rather than a generic loading spinner,
 * on both directions of a trip through someone else's UI (the browser tab
 * on web, SFSafariViewController on native).
 *
 * `direction`:
 *  - "opening"     — right before `login()` hands off (LoginPage): the
 *                     system browser is about to open (native) or the tab
 *                     is about to redirect (web).
 *  - "signing-in"  — control has come back and Auth0 is exchanging the
 *                     code for a token: `NativeAuthBridge.handleRedirectCallback`
 *                     on iOS, `Auth0Provider`'s own callback handling on web.
 *
 * After `RETRY_DELAY_MS` with no resolution (still mounted — a resolved
 * auth state routes the caller away before this fires), offers "Taking too
 * long? Try again". That re-calls `login()`; if `useAuth()` is already
 * reporting an `error` (the same dead-session shape `shared/api/provider.tsx`
 * treats as `invalid_grant` / a session Auth0 has revoked) it calls
 * `logout({ openUrl: false })` first — a local-only logout, no browser hop —
 * so retrying doesn't just re-enter the same broken exchange.
 *
 * One component, no new dependencies. Animation is plain CSS
 * (`animate-pulse`), so the existing global `[data-reduced-motion="true"]`
 * rule (index.css) already disables it — nothing extra to wire here.
 */
export function AuthHandoff({ direction }: { direction: AuthHandoffDirection }) {
  const { t } = useTranslation();
  const { login, logout, error } = useAuth();
  const [showRetry, setShowRetry] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setShowRetry(false);
    const id = window.setTimeout(() => setShowRetry(true), RETRY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [direction]);

  const handleRetry = () => {
    setRetrying(true);
    void (async () => {
      try {
        if (error) {
          await logout({ openUrl: false });
        }
      } finally {
        login();
        setRetrying(false);
      }
    })();
  };

  const message =
    direction === "opening" ? t("auth.handoff.opening") : t("auth.handoff.signingIn");

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-auth-handoff-bg px-6 text-center text-auth-handoff-fg"
    >
      {/* Decorative — the mark from generate-icons.mjs's markHtml(), reused
          as live text (same Instrument Sans family, eager-loaded in
          index.html) rather than a rasterized image. */}
      <div
        aria-hidden="true"
        className="flex animate-pulse items-center gap-1 font-bold leading-none [animation-duration:2.4s] [font-family:'Instrument_Sans',sans-serif]"
      >
        <span className="text-[64px] tracking-[-0.03em]">O</span>
        <span
          className="text-[17px] tracking-[0.02em] [transform:rotate(180deg)] [writing-mode:vertical-rl]"
        >
          LINGO
        </span>
      </div>

      <p className="max-w-xs text-sm text-auth-handoff-fg/70">{message}</p>

      {showRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-2 rounded-lg border border-auth-handoff-fg/25 px-4 py-2 text-sm font-medium text-auth-handoff-fg/90 transition-colors hover:bg-auth-handoff-fg/10 disabled:opacity-60"
        >
          {t("auth.handoff.retry")}
        </button>
      )}
    </div>
  );
}
