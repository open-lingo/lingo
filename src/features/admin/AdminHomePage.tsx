/**
 * AdminHomePage — operational dashboard at /admin/home.
 *
 * Filled in by task 2. This is a placeholder so the layout has a real
 * landing target during the shell migration.
 */
import { useTranslation } from "react-i18next";

import { Card } from "@/shared/components/ui/Card";

export function AdminHomePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h2 className="text-base font-semibold text-text-primary">
          {t("admin.home.title", "Dashboard")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("admin.home.placeholder", "Vital signs land here.")}
        </p>
      </Card>
    </div>
  );
}

export default AdminHomePage;
