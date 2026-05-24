import { useTranslation } from "react-i18next";

export function AdminUserEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
      <p className="text-lg font-medium text-text-secondary">
        {t("admin.selectUser")}
      </p>
      <p className="mt-2 text-sm text-text-muted">{t("admin.selectUserHint")}</p>
    </div>
  );
}
