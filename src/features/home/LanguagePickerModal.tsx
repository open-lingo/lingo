import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";

export function LanguagePickerModal() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  if (language) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pick-language-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <h2
          id="pick-language-title"
          className="text-lg font-bold text-gray-900 dark:text-white"
        >
          {t("home.pickLanguageTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("home.pickLanguageSubtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left transition hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/20"
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
