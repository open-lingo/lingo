import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { PracticeBreadcrumbs } from "./PracticeBreadcrumbs";
import { ReadingCrumbProvider } from "./readingCrumb";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { useViewport } from "@/shared/hooks/useViewport";
import { isFocusedFlow } from "@/routes/focusedFlow";

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
  const { isMobile } = useViewport();

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
  // Focused sessions get no breadcrumbs — `Layout` has already hidden the
  // header and tab bar for them, and a crumb trail would be the one stray piece
  // of app chrome the lesson player doesn't have. The session's own exit
  // control is the way out. Flashcard review qualifies below `md` only.
  const isFocusedSession = isFocusedFlow(norm, isMobile);

  return (
    // The hub index rides the shell's shared wide canvas (Layout <main> centers
    // + caps at 96vw), so it must NOT re-cap here. Sub-pages keep the standard
    // 2xl cap + breadcrumbs.
    // The reading routes publish which KIND of item they resolved so the
    // breadcrumb leaf can say "Story" or "Conversation" — the provider has to
    // sit above BOTH the crumbs and the outlet. See `readingCrumb`.
    <ReadingCrumbProvider>
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
    </ReadingCrumbProvider>
  );
}
