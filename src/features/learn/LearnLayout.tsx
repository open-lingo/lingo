import { Outlet, useLocation } from "react-router-dom";
import { FirstSessionArc } from "@/features/onboarding/FirstSessionArc";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isTransitLearnHome } from "@/shared/config/featureFlags";

export function LearnLayout() {
  const { pathname } = useLocation();
  const flags = useFeatureFlags();
  // The arc is a Learn-overview greeter. Inside a lesson / test / placement
  // it would float OVER the first exercise a deep-linked new user sees
  // (fixed inset-0 z-50) and block their taps — those flows already carry
  // their own framing, so the arc waits for the next Learn visit.
  const inFocusedFlow = /\/lessons\/|\/test-out\/|\/placement-test/.test(
    pathname,
  );
  // The transit-map homepage is a panning canvas that sizes itself — the 2xl
  // cap here would fight Layout's matching wideCanvas exemption on 4k.
  const learnIndexLang = /^\/([^/]+)\/learn\/?$/.exec(pathname)?.[1];
  const wideCanvas = isTransitLearnHome(flags, learnIndexLang);
  return (
    <div className={wideCanvas ? undefined : "mx-auto max-w-screen-2xl"}>
      {/* First-session onboarding arc — self-gates to brand-new learners only. */}
      {!inFocusedFlow && <FirstSessionArc />}
      <Outlet />
    </div>
  );
}
