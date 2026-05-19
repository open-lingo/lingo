import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { LandingPage } from "@/features/landing/LandingPage";

/**
 * Public marketing page. Reachable by anyone (including authed users — useful
 * when a user wants to share the landing URL or revisit the pitch).
 */
export function LandingRoute() {
  const { isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  return <LandingPage />;
}
