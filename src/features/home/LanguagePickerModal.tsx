import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { ModalBase } from "@/shared/components/ModalBase";

/** Blocks dismiss until the user picks a learning language. */
export function LanguagePickerModal() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  if (language) return null;

  return (
    <ModalBase
      title={t("home.pickLanguageTitle")}
      onClose={() => {}}
      maxWidth="max-w-md"
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className="px-6 py-4">
        <p className="text-sm text-text-secondary">
          {t("home.pickLanguageSubtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang)}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left transition hover:border-accent hover:bg-surface-muted"
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-text-primary">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}
