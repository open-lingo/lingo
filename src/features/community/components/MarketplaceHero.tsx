import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";

export type MarketplaceMetrics = {
  decks: number;
  creators: number;
  learners?: number;
};

export type MarketplaceHeroProps = {
  metrics: MarketplaceMetrics;
};

type QuickPill = { icon: IconName; label: string; to: string };

/**
 * MarketplaceHero — the top of the community marketplace: headline, a large
 * search bar (routes into Browse), quick-jump pills, a live metrics strip, and
 * language theme tiles. Sets the "discovery platform" tone before any content
 * rails so the page reads like a storefront, not an admin table.
 */
export function MarketplaceHero({ metrics }: MarketplaceHeroProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(langPath(`community/browse${q ? `?q=${encodeURIComponent(q)}` : ""}`));
  };

  const pills: QuickPill[] = [
    { icon: "flame", label: t("community.homeQuickTrending", "Trending"), to: langPath("community/browse?sort=trending") },
    { icon: "sparkles", label: t("community.homeQuickNew", "New"), to: langPath("community/browse?sort=newest") },
    { icon: "trophy", label: t("community.homeQuickCreators", "Creators"), to: langPath("community/contributors") },
  ];

  return (
    <section className="overflow-hidden rounded-card border border-border bg-gradient-to-br from-accent-muted/50 via-surface to-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
        {/* Main column — title, search, quick pills (~4/5 width). */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              {t("community.homeHeroTitle", "Discover community content")}
            </h1>
            <p className="text-sm text-text-secondary">
              {t(
                "community.homeHeroSubtitle",
                "Decks, stories, and resources created by learners — free forever.",
              )}
            </p>
          </div>

          <form onSubmit={onSearch} className="relative">
            <Icon
              name="search"
              size={18}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("community.homeSearchPlaceholder", "Search decks, creators, topics…")}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-24 text-sm text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              {t("community.navBrowse", "Browse")}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {pills.map((p) => (
              <Link
                key={p.label}
                to={p.to}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent hover:text-accent"
              >
                <Icon name={p.icon} size={13} aria-hidden />
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats column — real catalog counts as a compact vertical stack
            (~1/5 width). Stacks below the main column on mobile, divided by a
            top border there and a left border at sm+. */}
        <dl className="flex shrink-0 gap-6 border-t border-border/60 pt-3 sm:w-32 sm:flex-col sm:gap-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 lg:w-36">
          <Metric value={metrics.decks} label={t("community.homeStatDecks", "decks")} />
          <Metric value={metrics.creators} label={t("community.homeStatCreators", "creators")} />
          {typeof metrics.learners === "number" ? (
            <Metric value={metrics.learners} label={t("community.homeStatLearners", "learners")} />
          ) : null}
        </dl>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-bold leading-none tabular-nums text-text-primary">
        {value.toLocaleString()}
      </dd>
      <span className="mt-0.5 block text-xs uppercase tracking-wide text-text-secondary">
        {label}
      </span>
    </div>
  );
}
