import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useApi } from "@/shared/api/provider";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import type { DeckResponse } from "@/shared/api/decks";
import type { CreatorContentKind } from "./types";

const CONTENT_KINDS: CreatorContentKind[] = [
  "flashcard-pack",
  "story",
  "video",
  "course",
];

export function AdminTab() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi } = useApi();
  const [decks, setDecks] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [kindFilter, setKindFilter] = useState<CreatorContentKind | "all">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params = statusFilter === "all" ? {} : { status: statusFilter };
    decksApi
      .listAdminDecks(params)
      .then(setDecks)
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, decksApi]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      if (kindFilter !== "all" && kindFilter !== "flashcard-pack") return false;
      if (
        search.trim() &&
        !deck.name.toLowerCase().includes(search.trim().toLowerCase())
      )
        return false;
      return true;
    });
  }, [decks, kindFilter, search]);

  const handleApprove = async (deckId: string) => {
    setUpdating(deckId);
    try {
      await decksApi.adminUpdateDeckStatus(deckId, "published");
      load();
    } catch {
      // keep list as is
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (deckId: string) => {
    setUpdating(deckId);
    try {
      await decksApi.adminUpdateDeckStatus(deckId, "draft");
      load();
    } catch {
      // keep list as is
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("community.adminDecksTitle")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("community.adminDecksDesc")}
        </p>
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
              {k === "all"
                ? t("community.studioFilterAll")
                : k === "flashcard-pack"
                  ? t("community.studioFilterFlashcards")
                  : k === "course"
                    ? t("community.studioFilterCourses")
                    : k === "video"
                      ? t("community.studioFilterVideos")
                      : t("community.studioFilterStories")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === f
                  ? "bg-green-600 text-white"
                  : "bg-surface-muted text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {t(`community.adminFilter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("common.loading")}
        </p>
      ) : filteredDecks.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border py-6 text-center">
          <p className="text-text-muted">
            {t("community.adminNoDecks")}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredDecks.map((deck) => {
            const langName = getLanguageConfig(deck.languageId)?.name ?? deck.languageId;
            const authorLabel = deck.authorId
              ? t("community.adminDeckAuthor", { author: deck.authorId })
              : t("community.adminDeckAuthorUnknown");
            const isPublished = deck.status === "published";
            const busy = updating === deck.id;
            const coverUrl = getDeckImageUrl(deck.id, deck.image, "64/48");

            return (
              <li
                key={deck.id}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <img
                    src={coverUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {deck.name}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {langName}
                      {deck.cardCount != null && ` • ${deck.cardCount} cards`}
                      {deck.authorId && ` • ${authorLabel}`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        isPublished
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t(`community.status.${deck.status}`)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={langPath(`community/decks/${deck.id}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                  >
                    {t("community.studioPreview")}
                  </Link>
                  {!isPublished && (
                    <button
                      type="button"
                      onClick={() => handleApprove(deck.id)}
                      disabled={busy}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {t("community.studioPublish")}
                    </button>
                  )}
                  {isPublished && (
                    <button
                      type="button"
                      onClick={() => handleReject(deck.id)}
                      disabled={busy}
                      className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50"
                    >
                      {t("community.studioUnpublish")}
                    </button>
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
