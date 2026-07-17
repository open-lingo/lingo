import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import type { AdminCardPatch } from "./_helpers";
import {
  useAdminUserSrs,
  useUpdateUserSrs,
  useDeleteUserSrsCard,
} from "./useAdminUserDetail";

export function SrsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const srsQ = useAdminUserSrs(userId);
  const updateCard = useUpdateUserSrs(userId);
  const deleteCard = useDeleteUserSrsCard(userId);

  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editEase, setEditEase] = useState("");
  const [srsResetCardId, setSrsResetCardId] = useState<string | null>(null);

  const srsState = srsQ.data ?? {};
  const isLoading = srsQ.isFetching;

  const handleUpdateSrsCard = (cardId: string, updates: AdminCardPatch) => {
    const existing = srsState[cardId];
    if (!existing) return;
    const next = { ...existing };
    if (updates.dueDate !== undefined) {
      next.recognition = { ...existing.recognition, dueDate: updates.dueDate };
      next.production = { ...existing.production, dueDate: updates.dueDate };
    }
    if (updates.difficulty !== undefined) {
      const d = updates.difficulty;
      next.recognition = { ...next.recognition, difficulty: d };
      next.production = { ...next.production, difficulty: d };
    }
    if ("buriedUntil" in updates) next.buriedUntil = updates.buriedUntil;
    if ("lastSyncedAt" in updates) next.lastSyncedAt = updates.lastSyncedAt;
    updateCard.mutate(
      { cards: { [cardId]: next } },
      { onSuccess: () => setEditingCard(null) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {t("admin.srsDesc", "View and edit SRS (spaced repetition) state for this user.")}
        </p>
        <button
          type="button"
          onClick={() => srsQ.refetch()}
          disabled={isLoading}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
        >
          {isLoading ? t("common.loading") : t("flashcards.cardManager.refresh", "Refresh")}
        </button>
      </div>
      {isLoading && Object.keys(srsState).length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t("common.loading")}</p>
      ) : Object.keys(srsState).length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("admin.srsEmpty", "No SRS data for this user.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-muted">
                  {t("admin.srsCardId", "Card ID")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-muted">
                  {t("admin.srsDue", "Due")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-muted">
                  {t("admin.srsEase", "Ease")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-muted">
                  {t("admin.srsReps", "Reps")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-text-muted">
                  {t("admin.srsBuried", "Buried")}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-text-muted">
                  {t("flashcards.cardManager.colActions", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {Object.entries(srsState).map(([cardId, state]) => (
                <tr key={cardId} className="text-sm">
                  <td
                    className="max-w-[120px] truncate px-3 py-2 font-mono text-text-primary"
                    title={cardId}
                  >
                    {cardId}
                  </td>
                  <td className="px-3 py-2">
                    {editingCard === cardId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-32 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs text-text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSrsCard(cardId, { dueDate: editDueDate })}
                          className="text-success"
                        >
                          <Icon name="check" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCard(null)}
                          className="text-text-muted"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCard(cardId);
                          setEditDueDate(state.recognition.dueDate ?? "");
                          setEditEase(
                            String(
                              Math.max(
                                state.recognition.difficulty,
                                state.production.difficulty,
                              ) || 5,
                            ),
                          );
                        }}
                        className="text-left text-text-primary hover:underline"
                      >
                        {state.recognition.dueDate ?? "—"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingCard === cardId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min={1}
                          max={10}
                          value={editEase}
                          onChange={(e) => setEditEase(e.target.value)}
                          className="w-16 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs text-text-primary"
                          title="FSRS difficulty (1 = easiest, 10 = hardest)"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSrsCard(cardId, {
                              difficulty: parseFloat(editEase) || 5,
                            })
                          }
                          className="text-success"
                        >
                          <Icon name="check" size={16} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-text-secondary"
                        title={`Recognition ${state.recognition.difficulty.toFixed(1)} / Production ${state.production.difficulty.toFixed(1)}`}
                      >
                        {Math.max(
                          state.recognition.difficulty,
                          state.production.difficulty,
                        ).toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-text-secondary"
                    title={`Recognition ${state.recognition.reps} / Production ${state.production.reps}`}
                  >
                    {state.recognition.reps + state.production.reps}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{state.buriedUntil ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {state.buriedUntil && (
                      <button
                        type="button"
                        onClick={() => handleUpdateSrsCard(cardId, { buriedUntil: undefined })}
                        className="mr-1 text-xs text-success hover:underline"
                      >
                        {t("flashcards.cardManager.unbury", "Unbury")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSrsResetCardId(cardId)}
                      className="text-xs text-error hover:underline"
                    >
                      {t("flashcards.cardManager.reset", "Reset")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {srsResetCardId ? (
        <ConfirmModal
          title={t("admin.srsResetTitle", "Reset SRS card")}
          message={t("admin.srsResetConfirm", "Reset this card's SRS state?")}
          cancelLabel={t("forum.cancel")}
          confirmLabel={t("common.reset", "Reset")}
          danger
          onConfirm={() =>
            deleteCard.mutate(srsResetCardId, {
              onSettled: () => setSrsResetCardId(null),
            })
          }
          onCancel={() => setSrsResetCardId(null)}
        />
      ) : null}
    </div>
  );
}
