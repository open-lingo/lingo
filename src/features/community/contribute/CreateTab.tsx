import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { CardPreview } from "@/features/flashcards/CardPreview";
import { parseDeckJson } from "./deckUpload";
import type { Flashcard } from "@/features/flashcards/data/types";

const SAMPLE_CARD: Flashcard = {
  id: "sample",
  front: "안녕하세요",
  back: "Hello / Good day",
  note: "Polite greeting.",
  type: "word",
  reasoning:
    "안녕 = peace/wellness, 하다 = do, 세요 = polite ending. Literally 'do peace' → hello.",
  parts: [
    { segment: "안녕", meaning: "peace, wellness" },
    { segment: "하", meaning: "do (stem)" },
    { segment: "세요", particleId: "세요" },
  ],
};

export function CreateTab() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { decks: decksApi } = useApi();
  const showToast = useToast().showToast;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"type" | "preview">("type");
  const [uploading, setUploading] = useState(false);

  const handlePickDeck = () => {
    setStep("preview");
  };

  const handleStartEditing = () => {
    navigate(langPath("studio/decks/new"));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const payload = parseDeckJson(text);
      const res = await decksApi.createDeck(payload);
      showToast(
        t("community.uploadDeckSuccess", {
          name: res.name,
          count: res.cards?.length ?? 0,
          defaultValue: "Uploaded {{name}} ({{count}} cards)",
        }),
        "success",
      );
      navigate(langPath(`studio/decks/${res.id}`), { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  if (step === "preview") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to={langPath("community/contribute/create")} className="hover:text-gray-900 dark:hover:text-white">
            {t("community.studioCreateNew")}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">
            {t("community.addonKindFlashcardPack")}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("community.studioPreviewBeforeEdit")}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("community.studioPreviewDeckDesc")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("community.studioSampleCard")}
            </h3>
            <CardPreview card={SAMPLE_CARD} languageId="ko" compact />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("community.studioPreviewDeckBullets")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("type")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("forum.cancel")}
              </button>
              <button
                type="button"
                onClick={handleStartEditing}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {t("community.studioStartEditing")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("community.studioWhatToCreate")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("community.studioWhatToCreateDesc")}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={handlePickDeck}
          className="flex flex-col rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-green-400 hover:bg-green-50/50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/10"
        >
          <span className="text-3xl">🃏</span>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            {t("community.addonKindFlashcardPack")}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("community.studioDeckCardDesc")}
          </p>
        </button>

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex flex-col rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-green-400 hover:bg-green-50/50 disabled:opacity-60 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/10"
        >
          <span className="text-3xl">📤</span>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            {t("community.uploadDeck", "Upload deck")}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("community.uploadDeckDesc", "Upload a deck JSON file (same format as our API)")}
          </p>
        </button>

        <div className="flex flex-col rounded-xl border-2 border-dashed border-gray-200 p-6 opacity-60 dark:border-gray-700">
          <span className="text-3xl">📚</span>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            {t("community.addonKindCourse")}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("community.studioCourseComingSoon")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(langPath("community/contribute/create/story"))}
          className="flex flex-col rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-green-400 hover:bg-green-50/50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/10"
        >
          <span className="text-3xl">📖</span>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">
            {t("community.addonKindStory")}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("community.studioStoryCardDesc", "Write stories with clickable vocab linked to cards.")}
          </p>
        </button>
      </div>
    </div>
  );
}
