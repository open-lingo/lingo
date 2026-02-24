import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { StoryResponse } from "@/shared/api/stories";

type StoryPreviewModalProps = {
  story: StoryResponse | null;
  onClose: () => void;
  onSubscriptionChange?: () => void;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  subscribeLoading?: boolean;
};

export function StoryPreviewModal({
  story,
  onClose,
  onSubscriptionChange: _onSubscriptionChange,
  isSubscribed = false,
  onSubscribe,
  onUnsubscribe,
  subscribeLoading = false,
}: StoryPreviewModalProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!story) return null;

  const languageName = getLanguageConfig(story.languageId)?.name ?? story.languageId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-preview-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
          aria-label={t("flashcards.close")}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="overflow-y-auto p-6">
          <h2
            id="story-preview-title"
            className="pr-10 text-xl font-semibold text-gray-900 dark:text-white"
          >
            {story.title}
          </h2>
          {story.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {story.description}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {languageName}
          </p>
          {story.body && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
              <p className="whitespace-pre-wrap line-clamp-6">
                {story.body.replace(/\[card:[^\]]+\][^[]*\[\/card\]/g, (m) => {
                  const display = m.match(/\]([^[]*)\[\/card\]/)?.[1] ?? m;
                  return display;
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {onSubscribe && onUnsubscribe && (
            <button
              type="button"
              disabled={subscribeLoading}
              onClick={isSubscribed ? onUnsubscribe : onSubscribe}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isSubscribed
                  ? "border border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/30 dark:text-green-400"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {subscribeLoading ? "…" : isSubscribed ? t("flashcards.subscribed") : t("flashcards.subscribe")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("flashcards.close")}
          </button>
          <Link
            to={langPath(`practice/stories/${story.id}`)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("community.contentBrowserOpen")}
          </Link>
        </div>
      </div>
    </div>
  );
}
