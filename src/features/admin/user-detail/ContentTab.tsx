import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DeckResponse } from "@/shared/api/decks";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";
import { useUpdateDeckStatus, useDeleteUserDeck } from "./useAdminUserDetail";

export function ContentTab({
  userId,
  content,
}: {
  userId: string;
  content: DeckResponse[];
}) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const flags = useFeatureFlags();
  const [deckDeleteConfirm, setDeckDeleteConfirm] = useState<string | null>(null);
  const updateStatus = useUpdateDeckStatus(userId);
  const deleteDeck = useDeleteUserDeck(userId);

  const statusPendingId = updateStatus.isPending ? updateStatus.variables?.deckId : undefined;
  const statusPendingAction = updateStatus.variables?.status;
  const deletePendingId = deleteDeck.isPending ? deleteDeck.variables : undefined;

  const decks = content.filter((d) => !d.id.startsWith("vocab-"));

  return (
    <div className="space-y-4">
      {decks.length === 0 ? (
        <p className="text-sm text-text-muted">{t("admin.noContent")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {decks.map((deck) => {
            const coverUrl = getDeckImageUrl(deck.id, deck.image, "64/48");
            const isPublished = deck.status === "published";
            const isBusy =
              statusPendingId === deck.id ||
              deletePendingId === deck.id ||
              deckDeleteConfirm === deck.id;

            return (
              <li key={deck.id} className="py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{deck.name}</p>
                    <p className="text-sm text-text-muted">
                      {getLanguageConfig(deck.languageId)?.name ?? deck.languageId} ·{" "}
                      {deck.cardCount} cards · {deck.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Deck view lives under /community — dead route with the
                        community flag off, hide with it. */}
                    {isCommunityEnabled(flags) ? (
                      <Link
                        to={langPath(`community/decks/${deck.id}`)}
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        View
                      </Link>
                    ) : null}
                    {isPublished ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ deckId: deck.id, status: "draft" })
                        }
                        disabled={isBusy}
                        className="rounded border border-warning/40 px-2 py-1 text-sm font-medium text-warning hover:bg-warning/10 disabled:opacity-50"
                      >
                        {statusPendingId === deck.id && statusPendingAction === "draft"
                          ? t("common.loading")
                          : t("admin.unpublish")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ deckId: deck.id, status: "published" })
                        }
                        disabled={isBusy}
                        className="rounded border border-success/40 px-2 py-1 text-sm font-medium text-success hover:bg-success/10 disabled:opacity-50"
                      >
                        {statusPendingId === deck.id && statusPendingAction === "published"
                          ? t("common.loading")
                          : t("admin.publish")}
                      </button>
                    )}
                    {deckDeleteConfirm === deck.id ? (
                      <span className="flex items-center gap-1">
                        <span className="text-xs text-warning">
                          {t("admin.deleteDeckConfirm")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDeckDeleteConfirm(null);
                            deleteDeck.mutate(deck.id);
                          }}
                          disabled={deleteDeck.isPending}
                          className="rounded border border-error bg-error/10 px-2 py-1 text-xs font-medium text-error hover:bg-error/20 disabled:opacity-50"
                        >
                          {deletePendingId === deck.id ? t("common.loading") : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeckDeleteConfirm(null)}
                          disabled={deleteDeck.isPending}
                          className="rounded border border-border px-2 py-1 text-xs font-medium"
                        >
                          {t("forum.cancel")}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeckDeleteConfirm(deck.id)}
                        disabled={isBusy}
                        className="rounded border border-error/40 px-2 py-1 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
                      >
                        {t("admin.deleteDeck")}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
