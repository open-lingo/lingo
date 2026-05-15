import { useTranslation } from "react-i18next";
import { ModalBase } from "@/shared/components/ModalBase";
import { Button } from "@/shared/components/ui/Button";

type UnsavedChangesModalProps = {
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
  saving?: boolean;
};

export function UnsavedChangesModal({
  onSave,
  onDiscard,
  onCancel,
  saving = false,
}: UnsavedChangesModalProps) {
  const { t } = useTranslation();

  const handleSave = async () => {
    try {
      await onSave();
      onCancel();
    } catch {
      // Stay open on save error
    }
  };

  return (
    <ModalBase
      onClose={onCancel}
      title={t("studio.unsavedChangesTitle")}
      maxWidth="max-w-md"
    >
      <div className="px-6 py-4">
        <p className="text-sm text-text-secondary">
          {t("studio.unsavedChangesMessage")}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("community.editorSaving") : t("studio.unsavedSaveDraft")}
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard} disabled={saving}>
            {t("studio.unsavedDiscard")}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            {t("studio.unsavedCancel")}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
