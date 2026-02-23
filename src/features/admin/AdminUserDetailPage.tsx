import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
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
  const [user, setUser] = useState<UserListItem | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [content, setContent] = useState<DeckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [u, subs, decks] = await Promise.all([
          admin.getUser(userId),
          admin.getUserSubscriptions(userId).catch(() => []),
          admin.getUserContent(userId).catch(() => []),
        ]);
        if (!cancelled) {
          setUser(u);
          setSubscriptions(subs);
          setContent(decks);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, admin]);

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await admin.deleteUser(userId);
      navigate("/admin/users");
    } catch {
      // Error handled by toast or state
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {t("common.back")} {t("admin.users")}
      </Link>
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
              onClick={handleDelete}
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
          <div>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.noSubscriptions")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions.map((s) => (
                  <li
                    key={`${s.contentType}-${s.contentId}`}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {s.contentType} · {s.contentId}
                    </span>
                    {s.enabled === false && (
                      <span className="text-xs text-gray-500">disabled</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div>
            {content.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.noContent")}
              </p>
            ) : (
              <ul className="space-y-4">
                {content.map((deck) => {
                  const coverUrl = getDeckImageUrl(deck.id, deck.image, "64/48");
                  return (
                    <li
                      key={deck.id}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <img
                        src={coverUrl}
                        alt=""
                        className="h-12 w-16 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {deck.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getLanguageConfig(deck.languageId)?.name ?? deck.languageId} · {deck.cardCount} cards · {deck.status}
                        </p>
                      </div>
                      <Link
                        to={langPath(`studio/decks/${deck.id}`)}
                        className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                      >
                        View
                      </Link>
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
