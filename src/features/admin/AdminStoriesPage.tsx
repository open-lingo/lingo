import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useToast } from "@/shared/contexts/ToastContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { FilterBar, DataTable } from "@/shared/components/data";
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

  const statusOptions = [
    { label: t("community.adminFilterAll"), value: "all" },
    { label: t("community.adminFilterDraft"), value: "draft" },
    { label: t("community.adminFilterPublished"), value: "published" },
  ];

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: t("admin.storyTitle") || "Story",
        render: (story: StoryResponse) => (
          <span className="font-medium text-text-primary">{story.title}</span>
        ),
      },
      {
        key: "meta",
        label: t("admin.language") || "Language",
        render: (story: StoryResponse) => {
          const langName = getLanguageConfig(story.languageId)?.name ?? story.languageId;
          return (
            <span className="text-sm text-text-secondary">
              {langName}
              {story.authorId && ` • ${story.authorId}`}
            </span>
          );
        },
      },
      {
        key: "description",
        label: t("admin.description") || "Description",
        render: (story: StoryResponse) =>
          story.description ? (
            <p className="max-w-xs truncate text-sm text-text-muted">{story.description}</p>
          ) : null,
      },
      {
        key: "status",
        label: t("admin.status") || "Status",
        render: (story: StoryResponse) => {
          const isPublished = story.status === "published";
          return (
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                isPublished
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              }`}
            >
              {t(`community.status.${story.status}`)}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "",
        render: (story: StoryResponse) => {
          const isPublished = story.status === "published";
          const busy = updating === story.id;
          return (
            <div className="flex flex-wrap gap-2">
              <Link
                to={langPath(`community/contribute/create/story/${story.id}`)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
              >
                {t("community.studioEdit")}
              </Link>
              <Link
                to={langPath(`practice/stories/${story.id}`)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
              >
                {t("community.studioPreview")}
              </Link>
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => handlePublish(story.id)}
                  disabled={busy}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={!!updating}
                    className="rounded border border-border px-2 py-1 text-xs font-medium"
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
          );
        },
      },
    ],
    [t, langPath, updating, deleteConfirm]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("admin.stories")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("admin.contentDesc")}
        </p>
      </div>

      <FilterBar
        filters={[
          {
            label: t("admin.status") || "Status",
            value: statusFilter,
            options: statusOptions,
            onChange: (v) => setStatusFilter(v as StatusFilter),
          },
        ]}
        search={{
          label: t("common.search") || "Search",
          placeholder: t("community.studioSearchPlaceholder"),
          value: search,
          onChange: setSearch,
          onRefresh: load,
        }}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("common.loading")}
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(s) => s.id}
          emptyMessage={t("admin.noStories")}
        />
      )}
    </div>
  );
}
