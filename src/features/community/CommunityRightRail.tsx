import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { GitHubBadge } from "@/shared/components/GitHubBadge";
import { Avatar } from "./components/Avatar";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";

// Mock data — wire to real APIs once contributor + tag aggregation exists.
// Brief explicitly OK'd fake data for the marketplace feel.
const MOCK_TOP_CONTRIBUTORS = [
  { handle: "haru", upvotes: 1240 },
  { handle: "minji", upvotes: 980 },
  { handle: "spencer", upvotes: 620 },
  { handle: "trevor", upvotes: 410 },
  { handle: "yuki", upvotes: 280 },
];

const MOCK_TRENDING_TAGS = [
  { tag: "korean-particles", count: 18 },
  { tag: "k-drama", count: 14 },
  { tag: "topik-i", count: 11 },
  { tag: "kanji-radicals", count: 9 },
  { tag: "n5", count: 7 },
];

export function CommunityRightRail() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();

  // Submit-story is gated behind community.tabs.contribute — keep the
  // entry-point flag-aligned so the right rail doesn't dead-end users
  // into a route they can't access.
  const quickActions: Array<{ to: string; icon: IconName; label: string }> = [
    {
      to: langPath("community/decks/new"),
      icon: "plus",
      label: t("community.quickActionCreateDeck", "Create deck"),
    },
    ...(flags.community.tabs.contribute
      ? ([
          {
            to: langPath("community/contribute/create/story"),
            icon: "bookOpen" as IconName,
            label: t("community.quickActionSubmitStory", "Submit story"),
          },
        ] as const)
      : []),
    {
      to: langPath("community/decks/new?import=anki"),
      icon: "upload",
      label: t("community.quickActionImportAnki", "Import Anki deck"),
    },
  ];

  return (
    <div className="space-y-4">
      <RailCard heading={t("community.railQuickActions", "Quick actions")}>
        <ul className="space-y-1.5">
          {quickActions.map((a) => (
            <li key={a.label}>
              <Link
                to={a.to}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
              >
                <Icon name={a.icon} size={14} aria-hidden />
                <span>{a.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard heading={t("community.railTopContributors", "Top contributors")}>
        <ul className="space-y-2">
          {MOCK_TOP_CONTRIBUTORS.map(({ handle, upvotes }) => (
            <li key={handle} className="flex items-center justify-between gap-2 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Avatar name={handle} size="xs" />
                <Link
                  to={`/u/${handle}`}
                  className="truncate text-text-primary hover:text-accent"
                >
                  @{handle}
                </Link>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 text-xs tabular-nums text-text-muted">
                <Icon name="star" size={12} aria-hidden />
                {upvotes.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard heading={t("community.railTrendingTags", "Trending tags")}>
        <ul className="flex flex-wrap gap-1.5">
          {MOCK_TRENDING_TAGS.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                to={langPath(`community/explore?tag=${encodeURIComponent(tag)}`)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                #{tag}
                <span className="text-text-muted">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard heading={t("community.railOpenSource", "Open source")}>
        <p className="text-sm text-text-secondary">
          {t("community.railOpenSourceBlurb", "Community-built content. Free forever.")}
        </p>
        <div className="mt-3">
          <GitHubBadge />
        </div>
      </RailCard>
    </div>
  );
}

function RailCard({
  heading,
  children,
}: {
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {heading}
      </p>
      {children}
    </div>
  );
}
