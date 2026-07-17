import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Subscription } from "@/shared/api/users";
import { inputClassName } from "@/shared/components/ui/formStyles";
import {
  useAddUserSubscription,
  useRemoveUserSubscription,
} from "./useAdminUserDetail";

export function SubscriptionsTab({
  userId,
  subscriptions,
}: {
  userId: string;
  subscriptions: Subscription[];
}) {
  const { t } = useTranslation();
  const [addDeckId, setAddDeckId] = useState("");
  const addSub = useAddUserSubscription(userId);
  const removeSub = useRemoveUserSubscription(userId);

  const handleAdd = () => {
    if (!addDeckId.trim()) return;
    addSub.mutate(addDeckId.trim(), {
      onSuccess: () => setAddDeckId(""),
    });
  };

  const removingKey =
    removeSub.isPending && removeSub.variables
      ? `${removeSub.variables.contentType}-${removeSub.variables.contentId}`
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="add-deck-id" className="sr-only">
            {t("admin.deckId")}
          </label>
          <input
            id="add-deck-id"
            type="text"
            value={addDeckId}
            onChange={(e) => setAddDeckId(e.target.value)}
            placeholder={t("admin.deckId")}
            className={inputClassName}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={addSub.isPending || !addDeckId.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          {addSub.isPending ? t("common.loading") : t("admin.addSubscription")}
        </button>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-text-muted">{t("admin.noSubscriptions")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {subscriptions.map((s) => {
            const key = `${s.contentType}-${s.contentId}`;
            const isRemoving = removingKey === key;
            return (
              <li key={key} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-text-primary">
                  {s.contentType} · {s.contentId}
                </span>
                <div className="flex items-center gap-2">
                  {s.enabled === false && <span className="text-text-muted">disabled</span>}
                  <button
                    type="button"
                    onClick={() =>
                      removeSub.mutate({
                        contentType: s.contentType,
                        contentId: s.contentId,
                      })
                    }
                    disabled={isRemoving}
                    className="text-sm font-medium text-error hover:text-destructive disabled:opacity-50"
                  >
                    {isRemoving ? t("common.loading") : t("admin.removeSubscription")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
