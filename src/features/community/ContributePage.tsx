import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";

export function ContributePage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const langPath = useLangPath();

  const isCreatePath = pathname.includes("/contribute/create");
  const isAdminPath = pathname.includes("/contribute/admin");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {t("community.studioTitle")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t("community.studioDesc")}
          </p>
        </div>
        <GitHubBadge />
      </div>

      <TabList aria-label={t("community.studioTabsLabel")}>
        <TabLink
          to={langPath("community/contribute")}
          isActive={!isCreatePath && !isAdminPath}
        >
          {t("community.studioMyContent")}
        </TabLink>
        <TabLink
          to={langPath("community/contribute/create")}
          isActive={isCreatePath && !isAdminPath}
        >
          {t("community.studioCreateNew")}
        </TabLink>
        <TabLink
          to={langPath("community/contribute/admin")}
          isActive={isAdminPath}
        >
          {t("community.studioAdmin")}
        </TabLink>
      </TabList>

      <Outlet />
    </div>
  );
}
