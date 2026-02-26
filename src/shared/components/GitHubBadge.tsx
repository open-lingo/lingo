import { useEffect, useState } from "react";
import { Icon } from "@/shared/components/Icon";

const REPO_URL = "https://github.com/open-lingo/lingo";
const API_URL = "https://api.github.com/repos/open-lingo/lingo";

export function GitHubBadge() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let ok = true;
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: { stargazers_count?: number }) => {
        if (ok && typeof data?.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

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
