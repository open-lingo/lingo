import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ModalBase } from "@/shared/components/ModalBase";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useVisibleLearningLanguageIds } from "@/shared/hooks/useVisibleLearningLanguageIds";
import { LanguagePickerGrid } from "@/features/home/LanguagePickerGrid";
import type { Language } from "@/shared/domain/languages";

/**
 * "Switch language" modal — the flag-grid picker (same surface as
 * first-launch / landing), opened from the account menu. Selecting a language
 * mirrors LanguageSelector's behavior: persist the choice, then rewrite the
 * current URL's :lang segment so the page you're on follows you to the new
 * course.
 */
export function LanguageSwitchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const visibleIds = useVisibleLearningLanguageIds();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!language) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
    const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
    if (match && visibleIds.includes(match[1])) {
      navigate(`/${lang.id}${match[2] ?? ""}`);
    }
  };

  return (
    <ModalBase
      onClose={onClose}
      title={t("nav.switchLanguage", "Switch language")}
      maxWidth="max-w-2xl"
    >
      <div className="px-6 py-6">
        <LanguagePickerGrid
          onSelect={handleSelect}
          selectedId={language.id}
          headline={t("nav.switchLanguageHeadline", "Your courses")}
          subhead={t(
            "nav.switchLanguageSubhead",
            "Jump to another language — progress is saved per course.",
          )}
        />
      </div>
    </ModalBase>
  );
}
