import { useTranslation } from "react-i18next";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";

export function DeckSettingsBar({
  languageId,
  description,
  image,
  defaultEase,
  onLanguageChange,
  onDescriptionChange,
  onImageChange,
  onDefaultEaseChange,
}: {
  languageId: string;
  description: string;
  image: string;
  defaultEase: string;
  onLanguageChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageChange: (value: string) => void;
  onDefaultEaseChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 border-b border-border bg-surface-muted px-4 py-2">
      <div>
        <label className="mr-2 text-xs text-text-muted">{t("forum.language")}</label>
        <select
          value={languageId}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
        >
          {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[200px]">
        <label className="mr-2 text-xs text-text-muted">
          {t("community.contributeDescription")}
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t("community.contributeDescriptionPlaceholder")}
          className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
        />
      </div>
      <div className="min-w-[200px]">
        <label className="mr-2 text-xs text-text-muted">
          {t("community.editorDeckImageUrl")}
        </label>
        <input
          type="url"
          value={image}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder={t("community.editorDeckImageUrlPlaceholder")}
          className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
        />
      </div>
      <div className="min-w-[120px]">
        <label className="mr-2 text-xs text-text-muted">
          {t("community.editorDefaultEase")}
        </label>
        <input
          type="number"
          min={1.3}
          max={3}
          step={0.1}
          value={defaultEase}
          onChange={(e) => onDefaultEaseChange(e.target.value)}
          placeholder={t("community.editorDefaultEasePlaceholder")}
          className="w-full rounded border border-border px-2 py-1 text-sm bg-surface text-text-primary"
        />
      </div>
    </div>
  );
}
