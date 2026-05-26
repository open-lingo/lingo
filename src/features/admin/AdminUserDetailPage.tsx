import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type {
  AdminFriendRequestItem,
  AdminFriendRequestsResponse,
  UserListItem,
} from "@/shared/api/admin";
import type { Subscription } from "@/shared/api/users";
import type { DeckResponse } from "@/shared/api/decks";
import type { SRSCardState, SRSModalityState } from "@/features/flashcards/data/types";
import { isLegacyFlatFsrsState, migrateFlatToModal } from "@/features/flashcards/engine";
import { useDateFormat } from "@/shared/utils/formatDate";
import { Icon } from "@/shared/components/Icon";
import { TabList, TabButton } from "@/shared/components/ui/Tabs";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Button } from "@/shared/components/ui/Button";
import { AlertBanner } from "@/shared/components/ui/AlertBanner";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";

type TabId = "profile" | "subscriptions" | "content" | "srs" | "social";

/**
 * Why: server returns SRS payloads as opaque blobs, so legacy flat FSRS
 * rows or partially-migrated rows reach the admin view missing the modal
 * `recognition` / `production` shape. Without this, `state.recognition.dueDate`
 * throws at render time.
 */
const EMPTY_MODALITY: SRSModalityState = {
  stability: 0,
  difficulty: 0,
  state: "new",
  interval: 0,
  dueDate: "",
  lastReviewDate: "",
  reps: 0,
  lapses: 0,
};

function normalizeAdminSrsCard(raw: unknown): SRSCardState {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (
      obj.recognition &&
      typeof obj.recognition === "object" &&
      obj.production &&
      typeof obj.production === "object"
    ) {
      return obj as unknown as SRSCardState;
    }
    if (isLegacyFlatFsrsState(raw)) return migrateFlatToModal(raw);
    return {
      recognition: { ...EMPTY_MODALITY, ...((obj.recognition as object) ?? {}) },
      production: { ...EMPTY_MODALITY, ...((obj.production as object) ?? {}) },
      lastSyncedAt: typeof obj.lastSyncedAt === "string" ? obj.lastSyncedAt : undefined,
      lastReviewedAt: typeof obj.lastReviewedAt === "string" ? obj.lastReviewedAt : undefined,
      buriedUntil: typeof obj.buriedUntil === "string" ? obj.buriedUntil : undefined,
    };
  }
  return { recognition: { ...EMPTY_MODALITY }, production: { ...EMPTY_MODALITY } };
}

export function AdminUserDetailPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { admin } = useApi();
  const langPath = useLangPath();
  const showToast = useToast().showToast;
  const [user, setUser] = useState<UserListItem | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [content, setContent] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addDeckId, setAddDeckId] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [removingSub, setRemovingSub] = useState<string | null>(null);
  const [deckAction, setDeckAction] = useState<{ id: string; action: "unpublish" | "publish" | "delete" } | null>(null);
  const [deckDeleteConfirm, setDeckDeleteConfirm] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "banned">("active");
  const [editStatusExpiration, setEditStatusExpiration] = useState("");
  const [editCommunityStatus, setEditCommunityStatus] = useState<"active" | "banned" | "">("");
  const [editCommunityStatusExpiration, setEditCommunityStatusExpiration] = useState("");
  const [editRole, setEditRole] = useState<string>("user");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [srsState, setSrsState] = useState<Record<string, import("@/features/flashcards/data/types").SRSCardState>>({});
  const [srsLoading, setSrsLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editEase, setEditEase] = useState("");
  // Award-XP modal state. Admins enter an amount + reason and the
  // server-side endpoint updates the user row + leaderboard.
  const [awardXpOpen, setAwardXpOpen] = useState(false);
  const [awardXpAmount, setAwardXpAmount] = useState("100");
  const [awardXpReason, setAwardXpReason] = useState("");
  const [awardingXp, setAwardingXp] = useState(false);
  // Admin social-moderation tab state. Friend requests on behalf of the
  // user; populated lazily when the tab is opened.
  const [socialRequests, setSocialRequests] =
    useState<AdminFriendRequestsResponse>({ incoming: [], outgoing: [] });
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialBusyId, setSocialBusyId] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!userId) return;
    try {
      const [u, subs, decks] = await Promise.all([
        admin.getUser(userId),
        admin.getUserSubscriptions(userId).catch(() => []),
        admin.getUserContent(userId).catch(() => []),
      ]);
      setUser(u);
      setSubscriptions(subs);
      setContent(decks);
      setEditUsername(u.username);
      setEditAvatarUrl(u.profile_picture_key ?? "");
      setEditDisplayName(u.display_name ?? "");
      setEditStatus((u.status === "banned" ? "banned" : "active") as "active" | "banned");
      setEditStatusExpiration(u.status_expiration ?? "");
      setEditCommunityStatus((u.community_status === "banned" ? "banned" : u.community_status === "active" ? "active" : "") as "active" | "banned" | "");
      setEditCommunityStatusExpiration(u.community_status_expiration ?? "");
      setEditRole(u.role ?? "user");
    } catch {
      setUser(null);
    }
  }, [userId, admin]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadUserData().finally(() => setLoading(false));
  }, [userId, loadUserData]);

  const handleAwardXp = async () => {
    if (!userId) return;
    const parsed = Number(awardXpAmount);
    if (!Number.isFinite(parsed) || Math.floor(parsed) === 0) {
      showToast(
        t("admin.awardXp.invalidAmount", "Enter a non-zero amount"),
        "error",
      );
      return;
    }
    setAwardingXp(true);
    try {
      const result = await admin.awardXp(userId, {
        amount: Math.floor(parsed),
        reason: awardXpReason.trim(),
      });
      showToast(
        t("admin.awardXp.success", "Awarded {{n}} XP (total {{xp}})", {
          n: result.awarded,
          xp: result.xp,
        }),
        "success",
      );
      setAwardXpOpen(false);
      setAwardXpAmount("100");
      setAwardXpReason("");
      // Refresh the user row so the page reflects the new totals; the
      // admin detail page reads via loadUserData (no separate XP query).
      await loadUserData();
    } catch {
      showToast(
        t("admin.awardXp.error", "Failed to award XP"),
        "error",
      );
    } finally {
      setAwardingXp(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await admin.deleteUser(userId);
      showToast(t("admin.deleteSuccess"), "success");
      navigate("/admin/users");
    } catch {
      showToast(t("admin.deleteError"), "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!userId || !addDeckId.trim()) return;
    setAddingSub(true);
    try {
      await admin.addUserSubscription(userId, {
        contentType: "deck",
        contentId: addDeckId.trim(),
      });
      showToast("Subscription added", "success");
      setAddDeckId("");
      await loadUserData();
    } catch {
      showToast("Failed to add subscription", "error");
    } finally {
      setAddingSub(false);
    }
  };

  const handleRemoveSubscription = async (contentType: string, contentId: string) => {
    if (!userId) return;
    const key = `${contentType}-${contentId}`;
    setRemovingSub(key);
    try {
      await admin.removeUserSubscription(userId, contentType, contentId);
      showToast("Subscription removed", "success");
      await loadUserData();
    } catch {
      showToast("Failed to remove subscription", "error");
    } finally {
      setRemovingSub(null);
    }
  };

  const handleUnpublishDeck = async (deckId: string) => {
    setDeckAction({ id: deckId, action: "unpublish" });
    try {
      await admin.updateDeckStatus(deckId, "draft");
      showToast(t("admin.unpublish") + " — OK", "success");
      await loadUserData();
    } catch {
      showToast("Failed to unpublish", "error");
    } finally {
      setDeckAction(null);
    }
  };

  const handlePublishDeck = async (deckId: string) => {
    setDeckAction({ id: deckId, action: "publish" });
    try {
      await admin.updateDeckStatus(deckId, "published");
      showToast(t("admin.publish") + " — OK", "success");
      await loadUserData();
    } catch {
      showToast("Failed to publish", "error");
    } finally {
      setDeckAction(null);
    }
  };

  const handleDeleteDeck = async () => {
    const deckId = deckDeleteConfirm;
    if (!deckId) return;
    setDeckAction({ id: deckId, action: "delete" });
    setDeckDeleteConfirm(null);
    try {
      await admin.deleteDeck(deckId);
      showToast(t("admin.deleteDeck") + " — OK", "success");
      await loadUserData();
    } catch {
      showToast("Failed to delete deck", "error");
    } finally {
      setDeckAction(null);
    }
  };

  const handleDeleteDeckClick = (deckId: string) => {
    setDeckDeleteConfirm(deckId);
  };

  const handleProfileSave = async () => {
    if (!userId) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const updated = await admin.updateUser(userId, {
        username: editUsername.trim() || undefined,
        display_name: editDisplayName.trim() || undefined,
        profile_picture_key: editAvatarUrl.trim() || null,
        status: editStatus,
        status_expiration: editStatusExpiration.trim() || null,
        community_status: editCommunityStatus || undefined,
        community_status_expiration: editCommunityStatusExpiration.trim() || null,
        role: editRole as import("@/shared/api/admin").UserRole,
      });
      setUser(updated);
      setEditUsername(updated.username);
      setEditAvatarUrl(updated.profile_picture_key ?? "");
      setEditDisplayName(updated.display_name ?? "");
      setEditStatus((updated.status === "banned" ? "banned" : "active") as "active" | "banned");
      setEditStatusExpiration(updated.status_expiration ?? "");
      setEditCommunityStatus((updated.community_status === "banned" ? "banned" : updated.community_status === "active" ? "active" : "") as "active" | "banned" | "");
      setEditCommunityStatusExpiration(updated.community_status_expiration ?? "");
      setEditRole(updated.role ?? "user");
      showToast(t("profile.saved") ?? "Saved", "success");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 409
        ? "Username already taken"
        : "Failed to save profile";
      setProfileError(msg);
      showToast(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const loadSrsState = useCallback(async () => {
    if (!userId) return;
    setSrsLoading(true);
    try {
      const res = await admin.getUserSrs(userId);
      const normalized: Record<string, SRSCardState> = {};
      for (const [cardId, raw] of Object.entries(res.cards ?? {})) {
        normalized[cardId] = normalizeAdminSrsCard(raw);
      }
      setSrsState(normalized);
    } catch {
      setSrsState({});
    } finally {
      setSrsLoading(false);
    }
  }, [userId, admin]);

  /**
   * Admin SRS edit surface — patches apply to both modalities when they
   * touch per-modality fields (dueDate, difficulty), or to the card-shared
   * fields (buriedUntil, lastSyncedAt). For per-modality editing the admin
   * would need a richer UI; this matches Card Manager's "single column,
   * both modalities" behavior.
   */
  type AdminCardPatch = {
    dueDate?: string;
    difficulty?: number;
    buriedUntil?: string | undefined;
    lastSyncedAt?: string | undefined;
  };

  const handleUpdateSrsCard = async (cardId: string, updates: AdminCardPatch) => {
    if (!userId) return;
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
    try {
      const res = await admin.updateUserSrs(userId, {
        cards: { [cardId]: next },
      });
      setSrsState((prev) => ({ ...prev, ...res.cards }));
      setEditingCard(null);
      showToast("SRS updated", "success");
    } catch {
      showToast("Failed to update SRS", "error");
    }
  };

  const loadSocialRequests = useCallback(async () => {
    if (!userId) return;
    setSocialLoading(true);
    try {
      const res = await admin.listFriendRequests(userId);
      setSocialRequests(res);
    } catch {
      setSocialRequests({ incoming: [], outgoing: [] });
    } finally {
      setSocialLoading(false);
    }
  }, [userId, admin]);

  const handleAcceptRequest = async (req: AdminFriendRequestItem) => {
    if (!userId) return;
    setSocialBusyId(req.user_id);
    try {
      await admin.acceptFriendRequest(userId, req.user_id);
      showToast(t("admin.social.acceptSuccess", "Friend request accepted"), "success");
      await loadSocialRequests();
    } catch {
      showToast(t("admin.social.acceptError", "Failed to accept"), "error");
    } finally {
      setSocialBusyId(null);
    }
  };

  const handleDeclineRequest = async (req: AdminFriendRequestItem) => {
    if (!userId) return;
    setSocialBusyId(req.user_id);
    try {
      await admin.declineFriendRequest(userId, req.user_id);
      showToast(t("admin.social.declineSuccess", "Friend request removed"), "success");
      await loadSocialRequests();
    } catch {
      showToast(t("admin.social.declineError", "Failed to remove"), "error");
    } finally {
      setSocialBusyId(null);
    }
  };

  const handleResetSrsCard = async (cardId: string) => {
    if (!userId || !confirm(t("admin.srsResetConfirm", "Reset this card's SRS state?"))) return;
    try {
      await admin.deleteUserSrsCards(userId, [cardId]);
      setSrsState((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      showToast("SRS reset", "success");
    } catch {
      showToast("Failed to reset SRS", "error");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-muted">
          {loading ? t("common.loading") : "User not found"}
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "profile", label: t("admin.profile") },
    { id: "subscriptions", label: t("admin.subscriptions") },
    { id: "content", label: t("admin.content") },
    { id: "srs", label: t("admin.srs", "SRS") },
    { id: "social", label: t("admin.socialTab", "Social") },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            @{user.username}
          </h1>
          <p className="text-sm text-text-muted">
            {user.display_name} · {user.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setAwardXpOpen(true)}>
            {t("admin.awardXp.button", "Award XP")}
          </Button>
          <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            {t("admin.deleteUser")}
          </Button>
        </div>
      </div>

      {awardXpOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="award-xp-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!awardingXp) setAwardXpOpen(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleAwardXp();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl"
          >
            <h2 id="award-xp-title" className="text-base font-semibold text-text-primary">
              {t("admin.awardXp.title", "Award XP")}
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {t(
                "admin.awardXp.subtitle",
                "Adds XP to @{{name}}. Use a negative amount to subtract. Leaderboards update for opted-in users.",
                { name: user.username },
              )}
            </p>
            <label className="mt-4 block text-xs font-medium text-text-secondary">
              {t("admin.awardXp.amountLabel", "Amount")}
              <input
                type="number"
                inputMode="numeric"
                value={awardXpAmount}
                onChange={(e) => setAwardXpAmount(e.target.value)}
                autoFocus
                disabled={awardingXp}
                className={cn("mt-1 w-full", inputClassName)}
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-text-secondary">
              {t("admin.awardXp.reasonLabel", "Reason")}
              <input
                type="text"
                value={awardXpReason}
                onChange={(e) => setAwardXpReason(e.target.value)}
                placeholder={t(
                  "admin.awardXp.reasonPlaceholder",
                  "e.g. 'leaderboard test'",
                )}
                disabled={awardingXp}
                maxLength={500}
                className={cn("mt-1 w-full", inputClassName)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAwardXpOpen(false)}
                disabled={awardingXp}
              >
                {t("forum.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={awardingXp}>
                {awardingXp
                  ? t("common.loading")
                  : t("admin.awardXp.submit", "Award")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <ConfirmModal
          title={t("admin.deleteUser")}
          message={t("admin.deleteConfirm")}
          cancelLabel={t("forum.cancel")}
          confirmLabel={deleting ? t("common.loading") : "Delete"}
          danger
          onConfirm={handleDeleteUser}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}

      <TabList className="gap-6">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "srs") loadSrsState();
              if (tab.id === "social") loadSocialRequests();
            }}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabList>

      <div className="rounded-lg border border-border bg-surface p-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {profileError ? <AlertBanner>{profileError}</AlertBanner> : null}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("profile.avatarUrl")}
                </label>
                <div className="flex items-center gap-4">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center text-text-muted">
                      <Icon name="user" size={28} />
                    </div>
                  )}
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className={cn("flex-1", inputClassName)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.username")}
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm text-text-muted">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className={cn("flex-1", inputClassName)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.displayName")}
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder={t("admin.displayName")}
                  className={cn("mt-1 w-full", inputClassName)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.accountStatus")}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "banned")}
                  className={cn("mt-1 w-full", inputClassName)}
                >
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="banned">{t("admin.statusBanned")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.statusExpiration")}
                </label>
                <input
                  type="datetime-local"
                  value={
                    editStatusExpiration
                      ? (() => {
                          const d = new Date(editStatusExpiration);
                          const pad = (n: number) => n.toString().padStart(2, "0");
                          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()
                      : ""
                  }
                  onChange={(e) =>
                    setEditStatusExpiration(
                      e.target.value ? new Date(e.target.value).toISOString() : ""
                    )
                  }
                  className={cn("mt-1 w-full", inputClassName)}
                />
                <p className="mt-0.5 text-xs text-text-muted">
                  {t("admin.statusExpirationHelp")}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.communityStatus")}
                </label>
                <select
                  value={editCommunityStatus}
                  onChange={(e) => setEditCommunityStatus(e.target.value as "active" | "banned" | "")}
                  className={cn("mt-1 w-full", inputClassName)}
                >
                  <option value="">—</option>
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="banned">{t("admin.statusBanned")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.role")}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className={cn("mt-1 w-full", inputClassName)}
                >
                  <option value="user">{t("admin.roleUser")}</option>
                  <option value="trusted_creator">{t("admin.roleTrustedCreator")}</option>
                  <option value="moderator">{t("admin.roleModerator")}</option>
                  <option value="admin">{t("admin.roleAdmin")}</option>
                  <option value="super_admin">{t("admin.roleSuperAdmin")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-text-muted">
                  {t("admin.communityStatusExpiration")}
                </label>
                <input
                  type="datetime-local"
                  value={
                    editCommunityStatusExpiration
                      ? (() => {
                          const d = new Date(editCommunityStatusExpiration);
                          const pad = (n: number) => n.toString().padStart(2, "0");
                          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()
                      : ""
                  }
                  onChange={(e) =>
                    setEditCommunityStatusExpiration(
                      e.target.value ? new Date(e.target.value).toISOString() : ""
                    )
                  }
                  className={cn("mt-1 w-full", inputClassName)}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {profileSaving ? t("common.loading") : t("profile.save")}
            </button>
            <dl className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">
                  {t("admin.auth0Id")}
                </dt>
                <dd className="mt-1 font-mono text-sm text-text-secondary">
                  {user.auth0_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">
                  {t("admin.status")}
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {user.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-text-muted">
                  {t("admin.createdAt")}
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {formatDate(user.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {activeTab === "subscriptions" && (
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
                onClick={handleAddSubscription}
                disabled={addingSub || !addDeckId.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              >
                {addingSub ? t("common.loading") : t("admin.addSubscription")}
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-text-muted">
                {t("admin.noSubscriptions")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {subscriptions.map((s) => {
                  const key = `${s.contentType}-${s.contentId}`;
                  const isRemoving = removingSub === key;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="text-sm font-medium text-text-primary">
                        {s.contentType} · {s.contentId}
                      </span>
                      <div className="flex items-center gap-2">
                        {s.enabled === false && (
                          <span className="text-text-muted">disabled</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubscription(s.contentType, s.contentId)}
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
        )}

        {activeTab === "content" && (
          <div className="space-y-4">
            {content.filter((d) => !d.id.startsWith("vocab-")).length === 0 ? (
              <p className="text-sm text-text-muted">
                {t("admin.noContent")}
              </p>
            ) : (
              <ul className="space-y-4">
                {content.filter((d) => !d.id.startsWith("vocab-")).map((deck) => {
                  const coverUrl = getDeckImageUrl(deck.id, deck.image, "64/48");
                  const isPublished = deck.status === "published";
                  const isBusy =
                    deckAction?.id === deck.id ||
                    (deckDeleteConfirm === deck.id);

                  return (
                    <li
                      key={deck.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <img
                          src={coverUrl}
                          alt=""
                          className="h-12 w-16 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary">
                            {deck.name}
                          </p>
                          <p className="text-sm text-text-muted">
                            {getLanguageConfig(deck.languageId)?.name ?? deck.languageId} · {deck.cardCount} cards · {deck.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={langPath(`community/decks/${deck.id}`)}
                            className="text-sm font-medium text-accent hover:text-accent-hover"
                          >
                            View
                          </Link>
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleUnpublishDeck(deck.id)}
                              disabled={isBusy}
                              className="rounded border border-amber-300 px-2 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {deckAction?.id === deck.id && deckAction?.action === "unpublish"
                                ? t("common.loading")
                                : t("admin.unpublish")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublishDeck(deck.id)}
                              disabled={isBusy}
                              className="rounded border border-green-300 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {deckAction?.id === deck.id && deckAction?.action === "publish"
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
                                onClick={handleDeleteDeck}
                                disabled={!!deckAction}
                                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deckAction?.id === deck.id ? t("common.loading") : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeckDeleteConfirm(null)}
                                disabled={!!deckAction}
                                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium"
                              >
                                {t("forum.cancel")}
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteDeckClick(deck.id)}
                              disabled={isBusy}
                              className="rounded border border-red-300 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
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
        )}

        {activeTab === "social" && (
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
                onClick={loadSocialRequests}
                disabled={socialLoading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
              >
                {socialLoading
                  ? t("common.loading")
                  : t("flashcards.cardManager.refresh", "Refresh")}
              </button>
            </div>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("admin.social.incoming", "Incoming requests")}
                <span className="ml-1.5 text-text-secondary">
                  {socialRequests.incoming.length}
                </span>
              </h2>
              {socialRequests.incoming.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  {t("admin.social.noIncoming", "No incoming requests.")}
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {socialRequests.incoming.map((r) => (
                    <li
                      key={r.user_id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          @{r.username}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {r.display_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(r)}
                          disabled={socialBusyId === r.user_id}
                          className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
                        >
                          {socialBusyId === r.user_id
                            ? t("common.loading")
                            : t("admin.social.accept", "Accept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineRequest(r)}
                          disabled={socialBusyId === r.user_id}
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
                <span className="ml-1.5 text-text-secondary">
                  {socialRequests.outgoing.length}
                </span>
              </h2>
              {socialRequests.outgoing.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  {t("admin.social.noOutgoing", "No outgoing requests.")}
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {socialRequests.outgoing.map((r) => (
                    <li
                      key={r.user_id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          @{r.username}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {r.display_name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(r)}
                        disabled={socialBusyId === r.user_id}
                        className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        {socialBusyId === r.user_id
                          ? t("common.loading")
                          : t("admin.social.cancel", "Cancel")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {activeTab === "srs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                {t("admin.srsDesc", "View and edit SRS (spaced repetition) state for this user.")}
              </p>
              <button
                type="button"
                onClick={loadSrsState}
                disabled={srsLoading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
              >
                {srsLoading ? t("common.loading") : t("flashcards.cardManager.refresh", "Refresh")}
              </button>
            </div>
            {srsLoading && Object.keys(srsState).length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                {t("common.loading")}
              </p>
            ) : Object.keys(srsState).length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                {t("admin.srsEmpty", "No SRS data for this user.")}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
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
                        <td className="max-w-[120px] truncate px-3 py-2 font-mono text-text-primary" title={cardId}>
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
                                onClick={() => handleUpdateSrsCard(cardId, { difficulty: parseFloat(editEase) || 5 })}
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
                            onClick={() => handleResetSrsCard(cardId)}
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
          </div>
        )}
      </div>
    </div>
  );
}
