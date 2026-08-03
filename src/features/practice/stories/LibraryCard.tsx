/**
 * One row in the reading library — a story or a conversation.
 *
 * The peek is the point: opening line plus English gist, expandable in place,
 * so the learner can judge an item without committing to the read. The type
 * badge is what keeps the merged list legible — a conversation and a story
 * sort side by side, so the row has to say which it is.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { levelBand } from "@/features/practice/content";
import type { StoryProgress } from "@/shared/storyProgress";
import type { LibraryItem } from "./libraryItems";

/** Level -> chip tint. Ascending difficulty reads as ascending warmth. */
const LEVEL_TINT: Record<number, string> = {
  1: "bg-surface-muted text-text-muted",
  2: "bg-success/10 text-success",
  3: "bg-accent/10 text-accent",
  4: "bg-warning/10 text-warning",
  5: "bg-error/10 text-error",
};

interface LibraryCardProps {
  item: LibraryItem;
  progress: StoryProgress | null;
  to: string;
}

export function LibraryCard({ item, progress, to }: LibraryCardProps) {
  const { t } = useTranslation();
  const [peeking, setPeeking] = useState(false);
  const band = levelBand(item.level);
  const read = (progress?.reads ?? 0) > 0;
  const isConversation = item.kind === "conversation";

  return (
    <div className="rounded-lg border border-border bg-surface transition hover:border-accent">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`relative flex size-10 shrink-0 items-center justify-center rounded-lg ${
            read ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
          }`}
        >
          <Icon name={item.icon} size={20} aria-hidden />
          {read && (
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-success text-accent-foreground">
              <Icon name="check" size={10} aria-hidden />
            </span>
          )}
        </span>

        <Link to={to} className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-text-primary">{item.title}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isConversation
                  ? "bg-accent/10 text-accent"
                  : "bg-surface-muted text-text-muted"
              }`}
            >
              {isConversation
                ? t("practice.stories.typeConversation", { defaultValue: "Conversation" })
                : t("practice.stories.typeStory", { defaultValue: "Story" })}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                LEVEL_TINT[item.level] ?? LEVEL_TINT[1]
              }`}
            >
              {t(`practice.stories.level.${item.level}`, { defaultValue: band.name })}
            </span>
            {/* Length is the whole point of the progressive ladder — show it. */}
            <span className="shrink-0 text-xs tabular-nums text-text-muted">
              {isConversation
                ? t("practice.stories.turnCount", {
                    defaultValue: "{{count}} turns",
                    count: item.lineCount,
                  })
                : t("practice.stories.sentenceCount", {
                    defaultValue: "{{count}} lines",
                    count: item.lineCount,
                  })}
            </span>
            {item.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                {t(`practice.stories.tag.${tag}`, { defaultValue: tag })}
              </span>
            ))}
          </span>
          <span className="mt-0.5 block truncate text-sm text-text-secondary">{item.blurb}</span>
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
          <p className="text-lg leading-relaxed text-text-primary" lang={item.languageId}>
            {item.peekText}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{item.peekTranslation}</p>
          <p className="mt-2 text-xs text-text-muted">
            {isConversation
              ? t("practice.stories.metaConversation", {
                  defaultValue: "{{count}} turns · Module {{module}}",
                  count: item.lineCount,
                  module: item.module,
                })
              : t("practice.stories.meta", {
                  defaultValue: "{{count}} sentences · Module {{module}}",
                  count: item.lineCount,
                  module: item.module,
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
