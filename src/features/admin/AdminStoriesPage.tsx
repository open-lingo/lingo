import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { StoryResponse } from "@/shared/api/stories";

type StatusFilter = "all" | "draft" | "published";

export function AdminStoriesPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { admin } = useApi();
  const showToast = useToast().showToast;
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params = statusFilter === "all" ? {} : { status: statusFilter };
    admin
      .listStories(params)
      .then(setStories)
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, admin]);

  const filtered = useMemo(() => {
    if (!search.trim()) return stories;
    const q = search.toLowerCase().trim();
    return stories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
    );
  }, [stories, search]);

  const handlePublish = async (storyId: string) => {
    setUpdating(storyId);
    try {
      await admin.updateStoryStatus(storyId, "published");
      showToast(t("admin.publish") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to publish", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleUnpublish = async (storyId: string) => {
    setUpdating(storyId);
    try {
      await admin.updateStoryStatus(storyId, "draft");
      showToast(t("admin.unpublish") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to unpublish", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    const storyId = deleteConfirm;
    if (!storyId) return;
    setUpdating(storyId);
    setDeleteConfirm(null);
    try {
      await admin.deleteStory(storyId);
      showToast(t("admin.deleteStory") + " — OK", "success");
      load();
    } catch {
      showToast("Failed to delete story", "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("admin.stories")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("admin.contentDesc")}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("community.studioSearchPlaceholder")}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 sm:w-56 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === f
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t(`community.adminFilter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("common.loading")}
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400">{t("admin.noStories")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((story) => {
            const langName = getLanguageConfig(story.languageId)?.name ?? story.languageId;
            const isPublished = story.status === "published";
            const busy = updating === story.id;

            return (
              <li
                key={story.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {langName}
                    {story.authorId && ` • ${story.authorId}`}
                  </p>
                  {story.description && (
                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                      {story.description}
                    </p>
                  )}
                  <span
                    className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      isPublished
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                    }`}
                  >
                    {t(`community.status.${story.status}`)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={langPath(`community/contribute/create/story/${story.id}`)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {t("community.studioEdit")}
                  </Link>
                  <Link
                    to={langPath(`practice/stories/${story.id}`)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {t("community.studioPreview")}
                  </Link>
                  {!isPublished && (
                    <button
                      type="button"
                      onClick={() => handlePublish(story.id)}
                      disabled={busy}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      {busy ? t("common.loading") : t("admin.publish")}
                    </button>
                  )}
                  {isPublished && (
                    <button
                      type="button"
                      onClick={() => handleUnpublish(story.id)}
                      disabled={busy}
                      className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      {busy ? t("common.loading") : t("admin.unpublish")}
                    </button>
                  )}
                  {deleteConfirm === story.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={!!updating}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {busy ? t("common.loading") : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        disabled={!!updating}
                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium dark:border-gray-600"
                      >
                        {t("forum.cancel")}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(story.id)}
                      disabled={busy}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {t("admin.deleteStory")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
