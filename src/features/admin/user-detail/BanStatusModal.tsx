import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";
import { toLocalDatetimeValue } from "./_helpers";

export type StatusValues = {
  status: "active" | "banned";
  statusExpiration: string;
  communityStatus: "active" | "banned" | "";
  communityStatusExpiration: string;
};

/**
 * Ban / status modal. Owns only the account + community status fields; the
 * parent PATCHes them independently of the main profile form so an admin can
 * ban without saving unrelated edits. Cancel reverts the parent's shared
 * status state to the saved user.
 */
export function BanStatusModal({
  open,
  values,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  open: boolean;
  values: StatusValues;
  onChange: (patch: Partial<StatusValues>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t("admin.ban.title", "Manage ban / status")}
      subtitle={t(
        "admin.ban.subtitle",
        "Set account and community status. Leave an expiration empty for a permanent ban.",
      )}
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            {t("forum.cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={onSave} disabled={saving}>
            {saving ? t("common.loading") : t("profile.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium uppercase text-text-muted">
            {t("admin.accountStatus")}
            <select
              value={values.status}
              onChange={(e) => onChange({ status: e.target.value as "active" | "banned" })}
              className={cn("mt-1 w-full", inputClassName)}
            >
              <option value="active">{t("admin.statusActive")}</option>
              <option value="banned">{t("admin.statusBanned")}</option>
            </select>
          </label>
          <label className="block text-xs font-medium uppercase text-text-muted">
            {t("admin.statusExpiration")}
            <input
              type="datetime-local"
              value={toLocalDatetimeValue(values.statusExpiration)}
              onChange={(e) =>
                onChange({
                  statusExpiration: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
              className={cn("mt-1 w-full", inputClassName)}
            />
          </label>
          <label className="block text-xs font-medium uppercase text-text-muted">
            {t("admin.communityStatus")}
            <select
              value={values.communityStatus}
              onChange={(e) =>
                onChange({ communityStatus: e.target.value as "active" | "banned" | "" })
              }
              className={cn("mt-1 w-full", inputClassName)}
            >
              <option value="">—</option>
              <option value="active">{t("admin.statusActive")}</option>
              <option value="banned">{t("admin.statusBanned")}</option>
            </select>
          </label>
          <label className="block text-xs font-medium uppercase text-text-muted">
            {t("admin.communityStatusExpiration")}
            <input
              type="datetime-local"
              value={toLocalDatetimeValue(values.communityStatusExpiration)}
              onChange={(e) =>
                onChange({
                  communityStatusExpiration: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
              className={cn("mt-1 w-full", inputClassName)}
            />
          </label>
        </div>
        <p className="text-xs text-text-muted">{t("admin.statusExpirationHelp")}</p>
      </div>
    </Modal>
  );
}
