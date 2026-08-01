import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { PracticeBreadcrumbs } from "./PracticeBreadcrumbs";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";

/** Grace period before redirecting an apparently-anon user out of /practice.
 *  Auth0 can briefly report `isLoading: false && isAuthenticated: false` while
 *  silent auth completes via iframe; redirecting immediately races that and
 *  bounces real users back to /learn. 1.5s is invisible to humans and
 *  comfortably longer than the worst-case silent-auth round trip we've seen. */
const ANON_REDIRECT_GRACE_MS = 1500;

export function PracticeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const langPath = useLangPath();
  const practiceHubPath = langPath("practice");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const flags = useFeatureFlags();

  // Redirect when a disabled practice surface is hit directly (bookmark / old link)
  useEffect(() => {
    if (!flags.practice.externalContent && pathname.includes("/practice/external-content")) {
      navigate(practiceHubPath, { replace: true });
      return;
    }
  }, [flags.practice, pathname, navigate, practiceHubPath]);

  // Anon users hitting a /practice/* deep link land on the guided Learn hub
  // instead — Practice is per-account (progress/SRS) and the Learn page funnels
  // first-time users into the right starting point. The redirect is debounced
  // so Auth0's iframe-based silent-auth round trip can complete first.
  useEffect(() => {
    if (authLoading) {
      setShouldRedirect(false);
      return;
    }
    if (isAuthenticated) {
      setShouldRedirect(false);
      return;
    }
    const timer = window.setTimeout(
      () => setShouldRedirect(true),
      ANON_REDIRECT_GRACE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [authLoading, isAuthenticated]);

  if (shouldRedirect) {
    return <Navigate to={langPath("learn")} replace />;
  }

  const norm = pathname.replace(/\/$/, "");
  const isPracticeHub = norm === practiceHubPath;
  // The grammar review session is a focused flow (Layout hides header/footer
  // for it) — breadcrumbs above it would be the one stray chrome the lesson
  // player doesn't have. The session's X-out button is the way out.
  const isFocusedSession = /\/practice\/grammar\/review$/.test(norm);

  return (
    // The hub index rides the shell's shared wide canvas (Layout <main> centers
    // + caps at 96vw), so it must NOT re-cap here. Sub-pages keep the standard
    // 2xl cap + breadcrumbs.
    <div
      className={
        isPracticeHub
          ? "flex w-full flex-1 flex-col"
          : "mx-auto max-w-screen-2xl space-y-6"
      }
    >
      {!isPracticeHub && !isFocusedSession && <PracticeBreadcrumbs />}
      <Outlet />
    </div>
  );
}
