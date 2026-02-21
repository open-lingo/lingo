import { useTranslation } from "react-i18next";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <h2
          id="unsaved-modal-title"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {t("studio.unsavedChangesTitle")}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("studio.unsavedChangesMessage")}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {saving ? t("community.editorSaving") : t("studio.unsavedSaveDraft")}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("studio.unsavedDiscard")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("studio.unsavedCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
