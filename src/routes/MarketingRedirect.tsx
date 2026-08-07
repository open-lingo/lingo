import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { goToMarketing } from "@/shared/config/marketing";
import { IS_NATIVE } from "@/shared/platform/native";
import { isStandaloneDisplay } from "@/shared/platform/standalone";

/**
 * Sends an anonymous visitor to the marketing site.
 *
 * The pitch lives on a different origin now, so this cannot be a
 * `<Navigate>` — react-router only routes within this app. Renders the same
 * loading state the auth guards use, so the hand-off does not flash.
 *
 * ⚠️ EXCEPT when the app is installed. Every anonymous visitor reaches this
 * component — it backs both `RootRoute` and `RequireAuth` — and leaving the
 * origin from inside an installed app ejects the user out of it:
 *
 *   - Capacitor/iOS: a cross-origin `location.replace` does not navigate the
 *     webview at all. iOS hands the URL to Safari and the app is left on this
 *     loading text with no route and no way back. That is the FIRST screen of
 *     a cold install, before anyone has ever logged in.
 *   - Installed PWA: the navigation breaks out of the standalone context —
 *     Safari takes over on iOS, Android shows an in-app browser bar. A tester
 *     who installs the app, gets logged out, and taps the icon lands in a
 *     browser instead of the app they installed.
 *
 * Both cases get the in-app login route instead. The marketing pitch is not
 * part of the installed app and has no business being reachable from inside it.
 * A normal browser tab is unaffected and still leaves for the apex.
 */
export function MarketingRedirect({ path = "/" }: { path?: string }) {
  const { t } = useTranslation();
  const installed = IS_NATIVE || isStandaloneDisplay();

  useEffect(() => {
    if (installed) return;
    goToMarketing(path);
  }, [path, installed]);

  if (installed) return <Navigate to="/login" replace />;

  return (
    <div className="flex justify-center py-16">
      <p className="text-text-muted">{t("common.loading")}</p>
    </div>
  );
}
