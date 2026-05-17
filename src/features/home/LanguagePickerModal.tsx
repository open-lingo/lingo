import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { ModalBase } from "@/shared/components/ModalBase";
import { LanguagePickerGrid } from "./LanguagePickerGrid";

/** First-launch modal — blocks dismiss until the user picks a learning
 *  language. Renders the production 2×2 flag-grid picker. */
export function LanguagePickerModal() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  // Picker fires only when no language has been chosen yet. The default
  // setting was flipped from "ko" → null (Task #88) so this branch
  // actually triggers on new signups.
  if (language) return null;

  return (
    <ModalBase
      title={t("home.pickLanguageTitle", "Pick your language")}
      onClose={() => {}}
      maxWidth="max-w-2xl"
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className="px-6 pb-6 pt-2">
        <LanguagePickerGrid
          onSelect={setLanguage}
          headline=""
          subhead={t(
            "home.pickLanguageSubtitle",
            "Pick a language to get started. You can switch later from settings.",
          )}
          className=""
        />
      </div>
    </ModalBase>
  );
}
