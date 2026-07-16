import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * Placeholder shown at `/community/*` while the community surface is gated
 * off (feature flag `community.enabled`). The nav entry itself is hidden, so
 * this is the graceful landing for direct navigation / stale links rather
 * than a redirect or 404.
 */
export function CommunityComingSoon() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-muted text-accent">
        <Icon name="globe" size={30} aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("community.comingSoon.title", "Community is coming soon")}
      </h1>
      <p className="text-sm text-text-secondary">
        {t(
          "community.comingSoon.body",
          "Decks, stories, discussions and leaderboards are on the way — check back soon!",
        )}
      </p>
    </div>
  );
}
