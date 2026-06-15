import { Outlet } from "react-router-dom";
import { FirstSessionArc } from "@/features/onboarding/FirstSessionArc";

export function LearnLayout() {
  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* First-session onboarding arc — self-gates to brand-new learners only. */}
      <FirstSessionArc />
      <Outlet />
    </div>
  );
}
