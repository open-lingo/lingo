import { useAuth } from "@/shared/auth/useAuth";
import { HomePage } from "@/features/home/HomePage";
import { useTranslation } from "react-i18next";
import { MarketingRedirect } from "@/routes/MarketingRedirect";

/** Home route: anonymous visitors leave for the marketing site, else dashboard. */
export function ProtectedHome() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <MarketingRedirect />;
  }

  return <HomePage />;
}
