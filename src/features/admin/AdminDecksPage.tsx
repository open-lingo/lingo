import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { FilterBar, DataTable } from "@/shared/components/data";
import { Button } from "@/shared/components/ui/Button";
import type { DeckResponse } from "@/shared/api/decks";

type StatusFilter = "all" | "draft" | "published";

export function AdminDecksPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { decks: decksApi, admin } = useApi();
  const showToast = useToast().showToast;
  const [decks, setDecks] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const excludeVocab = decks.filter((d) => !d.id.startsWith("vocab-"));
    if (!search.trim()) return excludeVocab;
    const q = search.toLowerCase().trim();
    return excludeVocab.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.id.toLowerCase().includes(q)
    );
  }, [decks, search]);

  const handlePublish = async (deckId: string) => {
    setUpdating(deckId);
    try {
      await admin.updateDeckStatus(deckId, "published");
      showToast(t("admin.publish") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to publish", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleUnpublish = async (deckId: string) => {
    setUpdating(deckId);
    try {
      await admin.updateDeckStatus(deckId, "draft");
      showToast(t("admin.unpublish") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to unpublish", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    const deckId = deleteConfirm;
    if (!deckId) return;
    setUpdating(deckId);
    setDeleteConfirm(null);
    try {
      await admin.deleteDeck(deckId);
      showToast(t("admin.deleteDeck") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to delete deck", "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("admin.decks")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("admin.contentDesc")}
        </p>
      </div>

      <FilterBar
        filters={[
          {
            label: t("admin.status") || "Status",
            value: statusFilter,
            options: [
              { label: t("community.adminFilterAll"), value: "all" },
              { label: t("community.adminFilterDraft"), value: "draft" },
              { label: t("community.adminFilterPublished"), value: "published" },
            ],
            onChange: (v) => setStatusFilter(v as StatusFilter),
          },
        ]}
        search={{
          label: t("common.search") || "Search",
          placeholder: t("community.studioSearchPlaceholder"),
          value: search,
          onChange: setSearch,
          onRefresh: load,
        }}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("common.loading")}
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: "cover",
              label: "",
              render: (deck: DeckResponse) => {
                const coverUrl = getDeckImageUrl(deck.id, deck.image, "64/48");
                return (
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded-lg object-cover"
                  />
                );
              },
            },
            {
              key: "name",
              label: t("admin.deckName") || "Deck",
              render: (deck: DeckResponse) => (
                <span className="font-medium text-text-primary">{deck.name}</span>
              ),
            },
            {
              key: "meta",
              label: t("admin.language") || "Language",
              render: (deck: DeckResponse) => {
                const langName = getLanguageConfig(deck.languageId)?.name ?? deck.languageId;
                return (
                  <span className="text-sm text-text-secondary">
                    {langName}
                    {deck.cardCount != null && ` • ${deck.cardCount} cards`}
                    {deck.authorId && ` • ${deck.authorId}`}
                  </span>
                );
              },
            },
            {
              key: "status",
              label: t("admin.status") || "Status",
              render: (deck: DeckResponse) => {
                const isPublished = deck.status === "published";
                return (
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      isPublished
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                    }`}
                  >
                    {t(`community.status.${deck.status}`)}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "",
              render: (deck: DeckResponse) => {
                const isPublished = deck.status === "published";
                const busy = updating === deck.id;
                return (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={langPath(`community/decks/${deck.id}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                    >
                      {t("community.studioEdit")}
                    </Link>
                    {!isPublished && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(deck.id)}
                        disabled={busy}
                      >
                        {busy ? t("common.loading") : t("admin.publish")}
                      </Button>
                    )}
                    {isPublished && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-warning text-warning hover:bg-warning/10"
                        onClick={() => handleUnpublish(deck.id)}
                        disabled={busy}
                      >
                        {busy ? t("common.loading") : t("admin.unpublish")}
                      </Button>
                    )}
                    {deleteConfirm === deck.id ? (
                      <span className="flex items-center gap-1">
                        <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={!!updating}>
                          Confirm
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)} disabled={!!updating}>
                          {t("forum.cancel")}
                        </Button>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirm(deck.id)}
                        disabled={busy}
                      >
                        {t("admin.deleteDeck")}
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={filtered}
          getRowKey={(d) => d.id}
          emptyMessage={t("admin.noDecks")}
        />
      )}
    </div>
  );
}
