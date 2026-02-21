import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useApi } from "@/shared/api/provider";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import type { CreatorContentItem, ContentStatus, CreatorContentKind } from "./types";

const CONTENT_KINDS: CreatorContentKind[] = [
  "flashcard-pack",
  "story",
  "video",
  "course",
];

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
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  changes_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function MyContentTab() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi } = useApi();
  const [items, setItems] = useState<CreatorContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<CreatorContentKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params =
      statusFilter === "all"
        ? {}
        : { deck_status: statusFilter };
    decksApi
      .listMyDecks(params)
      .then((decks) => setItems(decks.map(deckToItem)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, decksApi]);

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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("community.studioMyContent")}
        </h2>
        <Link
          to={langPath("community/contribute/create")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
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
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 sm:w-56 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...CONTENT_KINDS] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                kindFilter === k
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t(`community.studioFilter${s.charAt(0).toUpperCase() + s.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("common.loading")}
        </p>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400">
            {t("community.studioNoContent")}
          </p>
          <Link
            to={langPath("community/contribute/create")}
            className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
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
            const busy = updating === item.id;
            const coverUrl = getDeckImageUrl(item.id, item.image, "64/48");

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                  {canPublishUnpublish && (
                    <>
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          disabled={busy}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          {t("community.studioPublish")}
                        </button>
                      )}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(item.id)}
                          disabled={busy}
                          className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {t("community.studioUnpublish")}
                        </button>
                      )}
                    </>
                  )}
                  {item.kind === "flashcard-pack" && (
                    <>
                      <Link
                        to={langPath(`studio/decks/${item.id}`)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {t("community.studioPreview")}
                      </Link>
                      <Link
                        to={langPath(`studio/decks/${item.id}`)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                      >
                        {t("community.studioEdit")}
                      </Link>
                    </>
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

