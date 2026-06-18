import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useApi } from "@/shared/api/provider";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import type { CreatorContentItem, ContentStatus, CreatorContentKind } from "./types";
import { Icon } from "@/shared/components/Icon";
import type { StoryResponse } from "@/shared/api/stories";

const CONTENT_KINDS: CreatorContentKind[] = [
  "flashcard-pack",
  "story",
  "video",
  "course",
];

function storyToItem(story: StoryResponse, cardCount?: number): CreatorContentItem {
  const status = (["draft", "submitted", "review", "published", "changes_requested", "rejected"].includes(story.status)
    ? story.status
    : story.status === "published"
      ? "published"
      : "draft") as ContentStatus;
  return {
    id: story.id,
    kind: "story",
    name: story.title,
    languageId: story.languageId,
    status,
    cardCount: cardCount ?? undefined,
    updatedAt: story.updatedAt ?? story.createdAt ?? new Date().toISOString(),
  };
}

function deckToItem(deck: {
  id: string;
  name: string;
  languageId: string;
  status: string;
  cardCount: number;
  updatedAt?: string;
  image?: string | null;
}): CreatorContentItem {
  const status = (["draft", "submitted", "review", "published", "changes_requested", "rejected"].includes(deck.status)
    ? deck.status
    : deck.status === "published"
      ? "published"
      : "draft") as ContentStatus;
  return {
    id: deck.id,
    kind: "flashcard-pack",
    name: deck.name,
    languageId: deck.languageId,
    status,
    cardCount: deck.cardCount,
    updatedAt: deck.updatedAt ?? new Date().toISOString(),
    image: deck.image,
  };
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: "bg-surface-muted text-text-primary",
  submitted: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  changes_requested: "bg-orange-100 text-orange-800",
  rejected: "bg-red-100 text-red-800",
};

export function MyContentTab() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi, stories: storiesApi } = useApi();
  const [deckItems, setDeckItems] = useState<CreatorContentItem[]>([]);
  const [storyItems, setStoryItems] = useState<CreatorContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<CreatorContentKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const deckParams =
      statusFilter === "all"
        ? { exclude_companion_decks: true }
        : { deck_status: statusFilter, exclude_companion_decks: true };
    const storyParams = statusFilter === "all" ? {} : { status: statusFilter };
    Promise.all([
      decksApi.listMyDecks(deckParams),
      storiesApi.listMyStories(storyParams),
    ])
      .then(async ([decks, stories]) => {
        setDeckItems(decks.map(deckToItem));
        const companionIds = [...new Set(stories.map((s) => s.companionDeckId))];
        const decksById: Record<string, { cardCount: number }> = {};
        if (companionIds.length > 0) {
          try {
            const batch = await decksApi.getDecksBatch(companionIds);
            batch.forEach((d) => {
              decksById[d.id] = { cardCount: d.cards?.length ?? 0 };
            });
          } catch {
            /* ignore */
          }
        }
        setStoryItems(
          stories.map((s) =>
            storyToItem(s, decksById[s.companionDeckId]?.cardCount)
          )
        );
      })
      .catch(() => {
        setDeckItems([]);
        setStoryItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, decksApi, storiesApi]);

  const items =
    kindFilter === "story"
      ? storyItems
      : kindFilter === "flashcard-pack"
        ? deckItems
        : [...deckItems, ...storyItems];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (
        search.trim() &&
        !item.name.toLowerCase().includes(search.trim().toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, kindFilter, search]);

  const handlePublish = async (id: string) => {
    setUpdating(id);
    try {
      await decksApi.updateDeckStatus(id, "published");
      load();
    } catch {
      /* keep list */
    } finally {
      setUpdating(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setUpdating(id);
    try {
      await decksApi.updateDeckStatus(id, "draft");
      load();
    } catch {
      /* keep list */
    } finally {
      setUpdating(null);
    }
  };

  const handlePublishStory = async (id: string) => {
    setUpdating(id);
    try {
      await storiesApi.updateStoryStatus(id, "published");
      load();
    } catch {
      /* keep list */
    } finally {
      setUpdating(null);
    }
  };

  const handleUnpublishStory = async (id: string) => {
    setUpdating(id);
    try {
      await storiesApi.updateStoryStatus(id, "draft");
      load();
    } catch {
      /* keep list */
    } finally {
      setUpdating(null);
    }
  };

  const kindLabels: Record<CreatorContentKind | "all", string> = {
    all: t("community.studioFilterAll"),
    "flashcard-pack": t("community.studioFilterFlashcards"),
    story: t("community.studioFilterStories"),
    video: t("community.studioFilterVideos"),
    course: t("community.studioFilterCourses"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("community.studioMyContent")}
        </h2>
        <Link
          to={langPath("community/contribute/create")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {t("community.studioCreateNew")}
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("community.studioSearchPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted sm:w-56"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...CONTENT_KINDS] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                kindFilter === k
                  ? "bg-green-600 text-white"
                  : "bg-surface-muted text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {kindLabels[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-green-600 text-white"
                  : "bg-surface-muted text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {t(`community.studioFilter${s.charAt(0).toUpperCase() + s.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("common.loading")}
        </p>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border py-6 text-center">
          <p className="text-text-muted">
            {t("community.studioNoContent")}
          </p>
          <Link
            to={langPath("community/contribute/create")}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t("community.studioCreateFirst")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredItems.map((item) => {
            const langName = getLanguageConfig(item.languageId)?.name ?? item.languageId;
            const kindLabel =
              item.kind === "flashcard-pack"
                ? t("community.addonKindFlashcardPack")
                : item.kind === "course"
                  ? t("community.addonKindCourse")
                  : item.kind === "video"
                    ? t("community.addonKindVideo")
                    : t("community.addonKindStory");
            const isPublished = item.status === "published";
            const canPublishUnpublish = item.kind === "flashcard-pack";
            const canPublishUnpublishStory = item.kind === "story";
            const busy = updating === item.id;
            const isStory = item.kind === "story";
            const coverUrl = isStory ? null : getDeckImageUrl(item.id, item.image, "64/48");

            return (
              <li
                key={`${item.kind}-${item.id}`}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-16 shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      <Icon name="stories" size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-text-primary">{item.name}</h3>
                    <p className="text-sm text-text-muted">
                      {kindLabel} • {langName}
                      {item.cardCount != null && ` • ${item.cardCount} cards`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                    >
                      {t(`community.status.${item.status}`)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canPublishUnpublishStory && (
                    <>
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handlePublishStory(item.id)}
                          disabled={busy}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {t("community.studioPublish")}
                        </button>
                      )}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => handleUnpublishStory(item.id)}
                          disabled={busy}
                          className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {t("community.studioUnpublish")}
                        </button>
                      )}
                    </>
                  )}
                  {canPublishUnpublish && (
                    <>
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          disabled={busy}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {t("community.studioPublish")}
                        </button>
                      )}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(item.id)}
                          disabled={busy}
                          className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {t("community.studioUnpublish")}
                        </button>
                      )}
                    </>
                  )}
                  {item.kind === "flashcard-pack" && (
                    <>
                      <Link
                        to={langPath(`community/decks/${item.id}`)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                      >
                        {t("community.studioPreview")}
                      </Link>
                      <Link
                        to={langPath(`community/decks/${item.id}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        {t("community.studioEdit")}
                      </Link>
                    </>
                  )}
                  {item.kind === "story" && (
                    <Link
                      to={langPath(`community/contribute/create/story/${item.id}`)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      {t("community.studioEdit")}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

