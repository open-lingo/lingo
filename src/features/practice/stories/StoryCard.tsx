/**
 * One story in the library. The peek is the point: opening line plus English
 * gist, expandable in place, so the learner can judge a story without
 * committing to the read.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { levelBand, type Story } from "@/features/practice/content";
import type { StoryProgress } from "@/shared/storyProgress";

interface StoryCardProps {
  story: Story;
  progress: StoryProgress | null;
  to: string;
}

export function StoryCard({ story, progress, to }: StoryCardProps) {
  const { t } = useTranslation();
  const [peeking, setPeeking] = useState(false);
  const band = levelBand(story.level);
  const read = (progress?.reads ?? 0) > 0;

  return (
    <div className="rounded-lg border border-border bg-surface transition hover:border-accent">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
            read ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"
          }`}
        >
          <Icon name={read ? "checkCircle" : "bookOpen"} size={18} aria-hidden />
        </span>

        <Link to={to} className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-text-primary">{story.title}</span>
            <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
              {t(`practice.stories.level.${story.level}`, { defaultValue: band.name })}
            </span>
            {story.tags?.map((tag) => (
              <span key={tag} className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                {t(`practice.stories.tag.${tag}`, { defaultValue: tag })}
              </span>
            ))}
          </span>
          <span className="mt-0.5 block truncate text-sm text-text-secondary">{story.theme}</span>
        </Link>

        <button
          type="button"
          onClick={() => setPeeking((v) => !v)}
          aria-expanded={peeking}
          className="shrink-0 rounded-md p-1.5 text-text-muted transition hover:text-text-primary"
          aria-label={t("practice.stories.peek", { defaultValue: "Preview" })}
        >
          <Icon name={peeking ? "chevronUp" : "chevronDown"} size={18} aria-hidden />
        </button>
      </div>

      {peeking && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-lg leading-relaxed text-text-primary" lang={story.languageId}>
            {story.sentences[0]?.text}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{story.sentences[0]?.translation}</p>
          <p className="mt-2 text-xs text-text-muted">
            {t("practice.stories.meta", {
              defaultValue: "{{count}} sentences · Module {{module}}",
              count: story.sentences.length,
              module: story.module,
            })}
            {read &&
              ` · ${t("practice.stories.readCount", {
                defaultValue: "read {{n}}×",
                n: progress?.reads ?? 0,
              })}`}
          </p>
        </div>
      )}
    </div>
  );
}
