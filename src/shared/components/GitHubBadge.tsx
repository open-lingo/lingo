import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/components/Icon";

const REPO_URL = "https://github.com/open-lingo/lingo";
const API_URL = "https://api.github.com/repos/open-lingo/lingo";

/**
 * Stargazer counts are public + rate-limited (60/hr unauth from one IP).
 * We had a raw `fetch` in a useEffect, which re-ran on every mount across
 * landing / community-rail / contribute pages — easy way to burn quota
 * and pay for the same data 4-6 times per session. Hoist to a shared
 * TanStack Query key with a 1-hour staleTime so every consumer reads
 * the same cache and the badge falls back to no number on rate-limit.
 */
async function fetchStargazerCount(): Promise<number | null> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data?.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export function GitHubBadge() {
  const { data: stars } = useQuery({
    queryKey: ["github", "repo-stars", "open-lingo/lingo"] as const,
    queryFn: fetchStargazerCount,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:border-border-muted hover:bg-surface-elevated hover:text-text-primary"
      aria-label="View open-lingo/lingo on GitHub"
    >
      <Icon name="github" size={14} className="shrink-0" />
      <span>open-lingo/lingo</span>
      {stars != null && (
        <span className="flex items-center gap-0.5 text-text-muted">
          <Icon name="star" size={12} className="shrink-0" fill="currentColor" />
          {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
        </span>
      )}
    </a>
  );
}
