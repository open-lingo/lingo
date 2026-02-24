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

type TabId = "profile" | "subscriptions" | "content";

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
              onClick={() => setActiveTab(tab.id)}
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
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {t("admin.username")}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                @{user.username}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {t("admin.displayName")}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {user.display_name}
              </dd>
            </div>
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
            {content.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.noContent")}
              </p>
            ) : (
              <ul className="space-y-4">
                {content.map((deck) => {
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
      </div>
    </div>
  );
}
