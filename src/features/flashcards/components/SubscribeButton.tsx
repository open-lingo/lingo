import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";

export type SubscribeButtonProps = {
  isSubscribed: boolean;
  loading?: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  className?: string;
};

/**
 * Prominent subscribe toggle for the deck preview.
 *
 * Two clear states:
 *  - not subscribed: solid accent call-to-action ("Subscribe") with a bookmark
 *    icon — the satisfying primary action.
 *  - subscribed: a calm "subscribed" confirmation (success-tinted, filled
 *    check) whose hover reveals an "Unsubscribe" affordance so the toggle is
 *    discoverable without nagging the user.
 */
export function SubscribeButton({
  isSubscribed,
  loading = false,
  onSubscribe,
  onUnsubscribe,
  className,
}: SubscribeButtonProps) {
  const { t } = useTranslation();

  if (isSubscribed) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={onUnsubscribe}
        aria-pressed
        className={cn(
          "group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success/50 bg-success/10 px-5 py-2.5 text-sm font-semibold text-success shadow-sm transition",
          "hover:border-danger/50 hover:bg-danger/10 hover:text-danger disabled:opacity-60",
          className,
        )}
      >
        {loading ? (
          <Icon name="refresh" size={16} className="animate-spin" aria-hidden />
        ) : (
          <>
            <Icon name="check" size={16} className="group-hover:hidden" aria-hidden />
            <Icon name="close" size={16} className="hidden group-hover:inline" aria-hidden />
          </>
        )}
        <span className="group-hover:hidden">
          {t("flashcards.subscribed", "Subscribed")}
        </span>
        <span className="hidden group-hover:inline">
          {t("flashcards.unsubscribe", "Unsubscribe")}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onSubscribe}
      aria-pressed={false}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition",
        "hover:bg-accent-hover hover:shadow-md active:scale-[0.99] disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <Icon name="refresh" size={16} className="animate-spin" aria-hidden />
      ) : (
        <Icon name="bookmark" size={16} aria-hidden />
      )}
      {t("flashcards.subscribe", "Subscribe")}
    </button>
  );
}
