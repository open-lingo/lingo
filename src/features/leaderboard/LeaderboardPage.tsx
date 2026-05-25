/**
 * Leaderboard page (`/:lang/community/leaderboard`).
 *
 * Wired to the real social API via the unified leaderboard card from the
 * social feature so weekly/monthly/friends tabs share one implementation.
 * The page renders `UnifiedLeaderboardCard` plus a back-link so it still
 * functions as a destination from nav and the social card's "See full
 * leaderboard" affordance.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { UnifiedLeaderboardCard } from "@/features/social/sections/LeaderboardsSection";

export function LeaderboardPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t("leaderboard.title", "Leaderboards")}
          </p>
          <h1 className="m-0 text-2xl font-bold text-text-primary">
            {t("leaderboard.heading", "Where you stand")}
          </h1>
        </div>
        <Link
          to={`/${lang}/social`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="arrowBigLeft" size={14} aria-hidden />
          {t("leaderboard.back", "Back to social")}
        </Link>
      </header>

      <UnifiedLeaderboardCard />
    </div>
  );
}
