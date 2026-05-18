import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Card } from "@/shared/components/ui";
import { useLang } from "@/shared/hooks/useLangPath";

/**
 * Leaderboard page — backend isn't built yet, so the previous render
 * shipped fake Alex/Sam/Jordan rows and a footer that literally read
 * "Mock data. Real rankings with backend." (Sora persona flagged it as
 * the surest "this is unfinished" signal in the app.) Per Spencer's
 * Option A: gut the page content and replace with a small honest
 * splash. The route stays alive (don't 404) so nav links work and any
 * future feature-flag toggle just turns the splash into the real
 * leaderboard. Mock data arrays were deleted.
 *
 * Nav-entry "Soon" badge lives in routes/Layout.tsx + features/
 * community/communityTabs.ts so it shows wherever the leaderboard tab
 * is rendered.
 */
export function LeaderboardPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg" className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-accent">
          <Icon name="flame" size={28} aria-hidden />
        </div>
        <h1 className="m-0 text-2xl font-bold text-text-primary">
          {t(
            "leaderboard.comingSoonTitle",
            "Leaderboards — coming soon",
          )}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          {t(
            "leaderboard.comingSoonBody",
            "We're building real rankings backed by the API. For now, focus on your own ★ — that's what compounds.",
          )}
        </p>
        <div className="mt-6">
          <Link
            to={`/${lang}/learn`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover"
          >
            <Icon name="arrowBigLeft" size={16} aria-hidden />
            {t("leaderboard.backToLearn", "Back to learn")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
