/**
 * The story library — browse, filter, and pick a story.
 *
 * Replaces the old flat list, which rendered every unlocked story forever with
 * no ordering and no read state. Unread-first is the default sort so the next
 * thing to read is always at the top.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, Pagination, SegmentedControl } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { getStories, LEVEL_BANDS } from "@/features/practice/content";
import { getAllStoryProgress } from "@/shared/storyProgress";
import { useCourseLevel } from "@/features/practice/useCourseLevel";
import { StoryCard } from "./StoryCard";

const PAGE_SIZE = 10;

type ReadFilter = "all" | "unread" | "read";

export function StoryLibraryPage() {
  const { t } = useTranslation();
  const langId = useLang();
  const langPath = useLangPath();
  const reachedModule = useCourseLevel();

  const stories = useMemo(() => getStories(langId, reachedModule), [langId, reachedModule]);
  const progress = useMemo(() => getAllStoryProgress(), []);

  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [level, setLevel] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    let out = stories.filter((s) => (level === null ? true : s.level === level));
    if (readFilter === "unread") out = out.filter((s) => !(progress[s.id]?.reads ?? 0));
    if (readFilter === "read") out = out.filter((s) => (progress[s.id]?.reads ?? 0) > 0);
    // Unread first, then the learner's OWN level downward — newest module
    // first, hardest level first within it.
    //
    // Ascending module was the original order and it buried the whole point of
    // the library: a learner at m21 has ~40 stories unlocked, so page 1 was all
    // m3-m9 and the longest read sat at rank 40 of 40. Someone deep in the
    // course opened it and saw six-sentence beginner content. Descending puts
    // level-appropriate reads on page 1 at every stage — at m3 only m3 is
    // unlocked, so a new learner is unaffected — and earlier modules stay one
    // scroll or a level-chip filter away.
    return out.slice().sort((a, b) => {
      const ar = progress[a.id]?.reads ?? 0;
      const br = progress[b.id]?.reads ?? 0;
      if ((ar > 0) !== (br > 0)) return ar > 0 ? 1 : -1;
      if (a.module !== b.module) return b.module - a.module;
      return b.level - a.level;
    });
  }, [stories, progress, readFilter, level]);

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.stories.title", { defaultValue: "Stories" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.stories.subtitle", {
          defaultValue: "Read what you can handle — tap any word you don't know.",
        })}
      </p>
    </div>
  );

  if (stories.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="bookOpen" size={28} aria-hidden />}
          title={t("practice.stories.empty.title", { defaultValue: "Nothing to read just yet" })}
          description={t("practice.stories.empty.description", {
            defaultValue:
              "Keep going in your lessons — as you learn more words, stories you can actually read will unlock here.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl<ReadFilter>
          value={readFilter}
          onChange={(v) => { setReadFilter(v); setPage(1); }}
          ariaLabel={t("practice.stories.filterAria", { defaultValue: "Filter stories" })}
          options={[
            { value: "all", label: t("practice.stories.filterAll", { defaultValue: "All" }) },
            { value: "unread", label: t("practice.stories.filterUnread", { defaultValue: "Unread" }) },
            { value: "read", label: t("practice.stories.filterRead", { defaultValue: "Read" }) },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_BANDS.map((band) => (
            <button
              key={band.level}
              type="button"
              onClick={() => { setLevel(level === band.level ? null : band.level); setPage(1); }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                level === band.level
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-muted text-text-muted hover:text-text-primary"
              }`}
            >
              {t(`practice.stories.level.${band.level}`, { defaultValue: band.name })}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {pageItems.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            progress={progress[story.id] ?? null}
            to={langPath(`practice/stories/${story.id}`)}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        ariaLabel={t("practice.stories.paginationAria", { defaultValue: "Stories pages" })}
      />
    </div>
  );
}
