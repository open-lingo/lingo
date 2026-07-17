import { useTranslation } from "react-i18next";
import {
  useAdminUserSocial,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from "./useAdminUserDetail";

export function SocialTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const socialQ = useAdminUserSocial(userId);
  const accept = useAcceptFriendRequest(userId);
  const decline = useDeclineFriendRequest(userId);

  const requests = socialQ.data ?? { incoming: [], outgoing: [] };
  const isLoading = socialQ.isFetching;
  const busyId = accept.isPending
    ? accept.variables
    : decline.isPending
      ? decline.variables
      : null;

  return (
    <div className="space-y-6" data-testid="admin-social-tab">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {t(
            "admin.social.desc",
            "Moderate this user's friend requests. Accept or decline pending requests on their behalf.",
          )}
        </p>
        <button
          type="button"
          onClick={() => socialQ.refetch()}
          disabled={isLoading}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
        >
          {isLoading ? t("common.loading") : t("flashcards.cardManager.refresh", "Refresh")}
        </button>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("admin.social.incoming", "Incoming requests")}
          <span className="ml-1.5 text-text-secondary">{requests.incoming.length}</span>
        </h2>
        {requests.incoming.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            {t("admin.social.noIncoming", "No incoming requests.")}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-t border-border">
            {requests.incoming.map((r) => (
              <li key={r.user_id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    @{r.username}
                  </p>
                  <p className="truncate text-xs text-text-muted">{r.display_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => accept.mutate(r.user_id)}
                    disabled={busyId === r.user_id}
                    className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
                  >
                    {busyId === r.user_id
                      ? t("common.loading")
                      : t("admin.social.accept", "Accept")}
                  </button>
                  <button
                    type="button"
                    onClick={() => decline.mutate(r.user_id)}
                    disabled={busyId === r.user_id}
                    className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
                  >
                    {t("admin.social.decline", "Decline")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("admin.social.outgoing", "Outgoing requests")}
          <span className="ml-1.5 text-text-secondary">{requests.outgoing.length}</span>
        </h2>
        {requests.outgoing.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            {t("admin.social.noOutgoing", "No outgoing requests.")}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-t border-border">
            {requests.outgoing.map((r) => (
              <li key={r.user_id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    @{r.username}
                  </p>
                  <p className="truncate text-xs text-text-muted">{r.display_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => decline.mutate(r.user_id)}
                  disabled={busyId === r.user_id}
                  className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
                >
                  {busyId === r.user_id
                    ? t("common.loading")
                    : t("admin.social.cancel", "Cancel")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
