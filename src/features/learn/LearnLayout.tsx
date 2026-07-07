import { Outlet, useLocation } from "react-router-dom";
import { FirstSessionArc } from "@/features/onboarding/FirstSessionArc";

export function LearnLayout() {
  const { pathname } = useLocation();
  // The arc is a Learn-overview greeter. Inside a lesson / test / placement
  // it would float OVER the first exercise a deep-linked new user sees
  // (fixed inset-0 z-50) and block their taps — those flows already carry
  // their own framing, so the arc waits for the next Learn visit.
  const inFocusedFlow = /\/lessons\/|\/test-out\/|\/placement-test/.test(
    pathname,
  );
  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* First-session onboarding arc — self-gates to brand-new learners only. */}
      {!inFocusedFlow && <FirstSessionArc />}
      <Outlet />
    </div>
  );
}
