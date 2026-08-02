import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { goToMarketing } from "@/shared/config/marketing";

/**
 * Sends an anonymous visitor to the marketing site.
 *
 * The pitch lives on a different origin now, so this cannot be a
 * `<Navigate>` — react-router only routes within this app. Renders the same
 * loading state the auth guards use, so the hand-off does not flash.
 */
export function MarketingRedirect({ path = "/" }: { path?: string }) {
  const { t } = useTranslation();

  useEffect(() => {
    goToMarketing(path);
  }, [path]);

  return (
    <div className="flex justify-center py-16">
      <p className="text-text-muted">{t("common.loading")}</p>
    </div>
  );
}
