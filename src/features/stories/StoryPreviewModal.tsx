import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { StoryResponse } from "@/shared/api/stories";
import { Icon } from "@/shared/components/Icon";
import { ModalBackdrop } from "@/shared/components/ModalBackdrop";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/components/ui/cn";

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

  if (!story) return null;

  const languageName =
    getLanguageConfig(story.languageId)?.name ?? story.languageId;

  return (
    <ModalBackdrop onClose={onClose} ariaLabelledBy="story-preview-title">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg border border-border bg-surface/95 p-2 text-text-primary shadow-sm backdrop-blur-sm transition hover:bg-surface-muted"
          aria-label={t("flashcards.close")}
        >
          <Icon name="close" size={20} />
        </button>

        <div className="overflow-y-auto p-6">
          <h2
            id="story-preview-title"
            className="pr-10 text-xl font-semibold text-text-primary"
          >
            {story.title}
          </h2>
          {story.description && (
            <p className="mt-1 text-sm text-text-secondary">{story.description}</p>
          )}
          <p className="mt-2 text-xs text-text-muted">{languageName}</p>
          {story.body && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-muted p-4 text-sm text-text-primary">
              <p className="line-clamp-6 whitespace-pre-wrap">
                {story.body.replace(/\[card:[^\]]+\][^[]*\[\/card\]/g, (m) => {
                  const display = m.match(/\]([^[]*)\[\/card\]/)?.[1] ?? m;
                  return display;
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
          {onSubscribe && onUnsubscribe && (
            <Button
              type="button"
              variant="outline"
              disabled={subscribeLoading}
              onClick={isSubscribed ? onUnsubscribe : onSubscribe}
              className={cn(
                isSubscribed &&
                  "border-success/60 bg-success/10 text-success hover:bg-success/15",
              )}
            >
              {subscribeLoading
                ? "…"
                : isSubscribed
                  ? t("flashcards.subscribed")
                  : t("flashcards.subscribe")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            {t("flashcards.close")}
          </Button>
          <Link
            to={langPath(`practice/stories/${story.id}`)}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            {t("community.contentBrowserOpen")}
          </Link>
        </div>
      </div>
    </ModalBackdrop>
  );
}
