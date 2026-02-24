import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { UserListItem } from "@/shared/api/admin";
import type { Subscription } from "@/shared/api/users";
import type { DeckResponse } from "@/shared/api/decks";

type TabId = "profile" | "subscriptions" | "content" | "srs";

export function AdminUserDetailPage() {
  const { t } = useTranslation();
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
      setSrsState(res.cards ?? {});
    } catch {
      setSrsState({});
    } finally {
      setSrsLoading(false);
    }
  }, [userId, admin]);

  const handleUpdateSrsCard = async (cardId: string, updates: Partial<import("@/features/flashcards/data/types").SRSCardState>) => {
    if (!userId) return;
    const existing = srsState[cardId];
    if (!existing) return;
    try {
      const res = await admin.updateUserSrs(userId, {
        cards: { [cardId]: { ...existing, ...updates } },
      });
      setSrsState((prev) => ({ ...prev, ...res.cards }));
      setEditingCard(null);
      showToast("SRS updated", "success");
    } catch {
      showToast("Failed to update SRS", "error");
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
        <p className="text-gray-500 dark:text-gray-400">
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
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            @{user.username}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.display_name} · {user.id}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {t("admin.deleteUser")}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            {t("admin.deleteConfirm")}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? t("common.loading") : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "srs") loadSrsState();
              }}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {profileError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {profileError}
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      👤
                    </div>
                  )}
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.username")}
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.displayName")}
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder={t("admin.displayName")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.accountStatus")}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "banned")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="banned">{t("admin.statusBanned")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("admin.statusExpirationHelp")}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.communityStatus")}
                </label>
                <select
                  value={editCommunityStatus}
                  onChange={(e) => setEditCommunityStatus(e.target.value as "active" | "banned" | "")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">—</option>
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="banned">{t("admin.statusBanned")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.role")}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="user">{t("admin.roleUser")}</option>
                  <option value="trusted_creator">{t("admin.roleTrustedCreator")}</option>
                  <option value="moderator">{t("admin.roleModerator")}</option>
                  <option value="admin">{t("admin.roleAdmin")}</option>
                  <option value="super_admin">{t("admin.roleSuperAdmin")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
            >
              {profileSaving ? t("common.loading") : t("profile.save")}
            </button>
            <dl className="grid gap-4 border-t border-gray-200 pt-6 dark:border-gray-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.auth0Id")}
                </dt>
                <dd className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                  {user.auth0_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.status")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("admin.createdAt")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleString()}
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
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSubscription}
                disabled={addingSub || !addDeckId.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
              >
                {addingSub ? t("common.loading") : t("admin.addSubscription")}
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.noSubscriptions")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions.map((s) => {
                  const key = `${s.contentType}-${s.contentId}`;
                  const isRemoving = removingSub === key;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {s.contentType} · {s.contentId}
                      </span>
                      <div className="flex items-center gap-2">
                        {s.enabled === false && (
                          <span className="text-xs text-gray-500">disabled</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubscription(s.contentType, s.contentId)}
                          disabled={isRemoving}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <img
                          src={coverUrl}
                          alt=""
                          className="h-12 w-16 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {deck.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getLanguageConfig(deck.languageId)?.name ?? deck.languageId} · {deck.cardCount} cards · {deck.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={langPath(`studio/decks/${deck.id}`)}
                            className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            View
                          </Link>
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleUnpublishDeck(deck.id)}
                              disabled={isBusy}
                              className="rounded border border-amber-300 px-2 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
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
                              className="rounded border border-green-300 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              {deckAction?.id === deck.id && deckAction?.action === "publish"
                                ? t("common.loading")
                                : t("admin.publish")}
                            </button>
                          )}
                          {deckDeleteConfirm === deck.id ? (
                            <span className="flex items-center gap-1">
                              <span className="text-xs text-amber-700 dark:text-amber-400">
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
                                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium dark:border-gray-600"
                              >
                                {t("forum.cancel")}
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteDeckClick(deck.id)}
                              disabled={isBusy}
                              className="rounded border border-red-300 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
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

        {activeTab === "srs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("admin.srsDesc", "View and edit SRS (spaced repetition) state for this user.")}
              </p>
              <button
                type="button"
                onClick={loadSrsState}
                disabled={srsLoading}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {srsLoading ? t("common.loading") : t("flashcards.cardManager.refresh", "Refresh")}
              </button>
            </div>
            {srsLoading && Object.keys(srsState).length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("common.loading")}
              </p>
            ) : Object.keys(srsState).length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("admin.srsEmpty", "No SRS data for this user.")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("admin.srsCardId", "Card ID")}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("admin.srsDue", "Due")}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("admin.srsEase", "Ease")}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("admin.srsReps", "Reps")}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("admin.srsBuried", "Buried")}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        {t("flashcards.cardManager.colActions", "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(srsState).map(([cardId, state]) => (
                      <tr key={cardId} className="text-sm">
                        <td className="max-w-[120px] truncate px-3 py-2 font-mono text-gray-700 dark:text-gray-300" title={cardId}>
                          {cardId}
                        </td>
                        <td className="px-3 py-2">
                          {editingCard === cardId ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                className="w-32 rounded border border-gray-300 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateSrsCard(cardId, { dueDate: editDueDate })}
                                className="text-green-600 dark:text-green-400"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCard(null)}
                                className="text-gray-500"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCard(cardId);
                                setEditDueDate(state.dueDate ?? "");
                                setEditEase(String(state.easeFactor ?? 2.5));
                              }}
                              className="text-left text-gray-700 hover:underline dark:text-gray-300"
                            >
                              {state.dueDate ?? "—"}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingCard === cardId ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                min={1.3}
                                value={editEase}
                                onChange={(e) => setEditEase(e.target.value)}
                                className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateSrsCard(cardId, { easeFactor: parseFloat(editEase) || 2.5 })}
                                className="text-green-600 dark:text-green-400"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{state.easeFactor?.toFixed(2) ?? "—"}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{state.repetitions ?? 0}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{state.buriedUntil ?? "—"}</td>
                        <td className="px-3 py-2 text-right">
                          {state.buriedUntil && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSrsCard(cardId, { buriedUntil: undefined })}
                              className="mr-1 text-xs text-green-600 hover:underline dark:text-green-400"
                            >
                              {t("flashcards.cardManager.unbury", "Unbury")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResetSrsCard(cardId)}
                            className="text-xs text-red-600 hover:underline dark:text-red-400"
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
