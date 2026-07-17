/**
 * TanStack Query hooks for the admin user-detail surface
 * (/admin/users/:id). Replaces the hand-rolled `loadUserData` /
 * `loadSrsState` / `loadSocialRequests` `useState` machinery that used to
 * live inside AdminUserDetailPage.
 *
 * Query-key scheme (all rooted at the user):
 *   ["admin","user",id]                 → the user row
 *   ["admin","user",id,"subscriptions"] → deck subscriptions
 *   ["admin","user",id,"content"]       → authored decks
 *   ["admin","user",id,"srs"]           → SRS card state (tab-gated)
 *   ["admin","user",id,"social"]        → friend requests (tab-gated)
 *
 * Mutations invalidate the narrowest key they affect.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { setImpersonation } from "@/shared/auth/impersonation";
import type {
  AdminFriendRequestsResponse,
  AdminUserUpdatePayload,
} from "@/shared/api/admin";
import type { SRSCardState } from "@/features/flashcards/data/types";
import { normalizeAdminSrsCard } from "./_helpers";

const USER_STALE = 30_000;
const TAB_STALE = 15_000;

export const adminUserKeys = {
  user: (id: string) => ["admin", "user", id] as const,
  subscriptions: (id: string) => ["admin", "user", id, "subscriptions"] as const,
  content: (id: string) => ["admin", "user", id, "content"] as const,
  srs: (id: string) => ["admin", "user", id, "srs"] as const,
  social: (id: string) => ["admin", "user", id, "social"] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────

export function useAdminUser(userId: string | undefined) {
  const { admin } = useApi();
  return useQuery({
    queryKey: adminUserKeys.user(userId ?? ""),
    queryFn: () => admin.getUser(userId as string),
    enabled: !!userId,
    staleTime: USER_STALE,
  });
}

export function useAdminUserSubscriptions(userId: string | undefined) {
  const { admin } = useApi();
  return useQuery({
    queryKey: adminUserKeys.subscriptions(userId ?? ""),
    // Tolerate a missing/failed subscriptions endpoint the same way the old
    // Promise.all did (`.catch(() => [])`).
    queryFn: () => admin.getUserSubscriptions(userId as string).catch(() => []),
    enabled: !!userId,
    staleTime: USER_STALE,
  });
}

export function useAdminUserContent(userId: string | undefined) {
  const { admin } = useApi();
  return useQuery({
    queryKey: adminUserKeys.content(userId ?? ""),
    queryFn: () => admin.getUserContent(userId as string).catch(() => []),
    enabled: !!userId,
    staleTime: USER_STALE,
  });
}

/** SRS state, normalized to the modal shape. Tab-gated via `enabled`. */
export function useAdminUserSrs(
  userId: string | undefined,
  opts?: { enabled?: boolean },
) {
  const { admin } = useApi();
  return useQuery({
    queryKey: adminUserKeys.srs(userId ?? ""),
    queryFn: async () => {
      const res = await admin.getUserSrs(userId as string);
      const normalized: Record<string, SRSCardState> = {};
      for (const [cardId, raw] of Object.entries(res.cards ?? {})) {
        normalized[cardId] = normalizeAdminSrsCard(raw);
      }
      return normalized;
    },
    enabled: !!userId && (opts?.enabled ?? true),
    staleTime: TAB_STALE,
  });
}

/** Friend requests (incoming + outgoing). Tab-gated via `enabled`. */
export function useAdminUserSocial(
  userId: string | undefined,
  opts?: { enabled?: boolean },
) {
  const { admin } = useApi();
  return useQuery<AdminFriendRequestsResponse>({
    queryKey: adminUserKeys.social(userId ?? ""),
    queryFn: () => admin.listFriendRequests(userId as string),
    enabled: !!userId && (opts?.enabled ?? true),
    staleTime: TAB_STALE,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

/**
 * Award (or subtract) XP. Toast copy carries the server-returned totals, so
 * it lives in this hook's onSuccess. Callers close their modal in a
 * call-site `onSuccess`.
 */
export function useAwardXp(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; reason: string }) =>
      admin.awardXp(userId, body),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.user(userId) });
      showToast(
        t("admin.awardXp.success", "Awarded {{n}} XP (total {{xp}})", {
          n: result.awarded,
          xp: result.xp,
        }),
        "success",
      );
    },
    onError: () => {
      showToast(t("admin.awardXp.error", "Failed to award XP"), "error");
    },
  });
}

/**
 * Patch the user row. Deliberately toast-free: profile save vs. ban/status
 * save have different success/error copy, so the two call sites own their
 * toasts. Both invalidate the user query.
 */
export function useUpdateAdminUser(userId: string) {
  const { admin } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminUserUpdatePayload) =>
      admin.updateUser(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.user(userId) });
    },
  });
}

export function useUpdateUserSrs(userId: string) {
  const { admin } = useApi();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { cards: Record<string, SRSCardState> }) =>
      admin.updateUserSrs(userId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.srs(userId) });
      showToast("SRS updated", "success");
    },
    onError: () => {
      showToast("Failed to update SRS", "error");
    },
  });
}

export function useDeleteUserSrsCard(userId: string) {
  const { admin } = useApi();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => admin.deleteUserSrsCards(userId, [cardId]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.srs(userId) });
      showToast("SRS reset", "success");
    },
    onError: () => {
      showToast("Failed to reset SRS", "error");
    },
  });
}

export function useAddUserSubscription(userId: string) {
  const { admin } = useApi();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) =>
      admin.addUserSubscription(userId, { contentType: "deck", contentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.subscriptions(userId) });
      showToast("Subscription added", "success");
    },
    onError: () => {
      showToast("Failed to add subscription", "error");
    },
  });
}

export function useRemoveUserSubscription(userId: string) {
  const { admin } = useApi();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contentType: string; contentId: string }) =>
      admin.removeUserSubscription(userId, vars.contentType, vars.contentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.subscriptions(userId) });
      showToast("Subscription removed", "success");
    },
    onError: () => {
      showToast("Failed to remove subscription", "error");
    },
  });
}

export function useUpdateDeckStatus(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deckId: string; status: "draft" | "published" }) =>
      admin.updateDeckStatus(vars.deckId, vars.status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.content(userId) });
      showToast(
        (vars.status === "draft" ? t("admin.unpublish") : t("admin.publish")) +
          " — OK",
        "success",
      );
    },
    onError: (_err, vars) => {
      showToast(
        vars.status === "draft" ? "Failed to unpublish" : "Failed to publish",
        "error",
      );
    },
  });
}

export function useDeleteUserDeck(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => admin.deleteDeck(deckId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.content(userId) });
      showToast(t("admin.deleteDeck") + " — OK", "success");
    },
    onError: () => {
      showToast("Failed to delete deck", "error");
    },
  });
}

export function useDeleteUser(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: () => admin.deleteUser(userId),
    onSuccess: () => {
      showToast(t("admin.deleteSuccess"), "success");
    },
    onError: () => {
      showToast(t("admin.deleteError"), "error");
    },
  });
}

export function useAcceptFriendRequest(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherId: string) => admin.acceptFriendRequest(userId, otherId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.social(userId) });
      showToast(t("admin.social.acceptSuccess", "Friend request accepted"), "success");
    },
    onError: () => {
      showToast(t("admin.social.acceptError", "Failed to accept"), "error");
    },
  });
}

export function useDeclineFriendRequest(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherId: string) => admin.declineFriendRequest(userId, otherId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.social(userId) });
      showToast(t("admin.social.declineSuccess", "Friend request removed"), "success");
    },
    onError: () => {
      showToast(t("admin.social.declineError", "Failed to remove"), "error");
    },
  });
}

/**
 * Start impersonating the user. sessionStorage state is written BEFORE the
 * query cache is invalidated so the next `/users/me` refetch immediately
 * attaches the impersonation header. Callers navigate on a call-site
 * `onSuccess`.
 */
export function useStartImpersonation(userId: string) {
  const { admin } = useApi();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => admin.impersonateStart(userId),
    onSuccess: (res) => {
      setImpersonation({
        targetUserId: res.target_user_id,
        targetUsername: res.target_username,
        targetDisplayName: res.target_display_name,
        // We don't have the admin's UUID here unless an upstream fetch
        // attached it; the banner just won't have a "return to admin"
        // anchor (clicking Stop bounces back to /admin/users/<target>).
        adminUserId: "",
      });
      // Force every cached query to refetch so the next page paints as the
      // impersonated user.
      qc.invalidateQueries();
      showToast(
        t("admin.impersonate.started", "Now acting as @{{name}}", {
          name: res.target_username,
        }),
        "success",
      );
    },
    onError: () => {
      showToast(t("admin.impersonate.error", "Failed to start impersonation"), "error");
    },
  });
}
