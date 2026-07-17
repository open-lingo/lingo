import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api";
import type { CommunityCategory, CommunityTag } from "@/shared/api/community";
import { MarkdownEditor } from "./MarkdownEditor";
import { PageShell } from "@/shared/components/PageShell";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { useToast } from "@/shared/contexts/ToastContext";

export function NewThreadPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { community } = useApi();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const categoriesQuery = useQuery<CommunityCategory[]>({
    queryKey: ["community", "categories"],
    queryFn: ({ signal }) => community.listCategories(signal),
    staleTime: 5 * 60_000,
  });

  const tagsQuery = useQuery<CommunityTag[]>({
    queryKey: ["community", "tags"],
    queryFn: ({ signal }) => community.listTags(signal),
    staleTime: 5 * 60_000,
  });

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];

  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Default categoryId once categories arrive.
  if (!categoryId && categories.length > 0) {
    setCategoryId(categories[0]!.id);
  }

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const createMutation = useMutation({
    mutationFn: () =>
      community.createThread({
        categoryId,
        title: title.trim(),
        bodyMarkdown: body,
        tagIds,
      }),
    onSuccess: (newThread) => {
      qc.invalidateQueries({ queryKey: ["community", "threads"] });
      navigate(langPath(`community/discuss/thread/${newThread.id}`));
    },
    onError: () => {
      showToast(t("forum.createError") ?? "Could not create thread", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) return;
    createMutation.mutate();
  };

  if (categoriesQuery.isLoading) {
    return (
      <PageShell variant="narrow" spaceY="md">
        <CenteredLoader py="lg" />
      </PageShell>
    );
  }

  return (
    <PageShell variant="narrow" spaceY="md">
      <Link to={langPath("community")} className="text-sm text-text-secondary hover:text-text-primary">
          <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("community.title")}
        </Link>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("forum.newThread")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="thread-category" className="mb-1 block text-sm font-medium text-text-secondary">
            {t("forum.category")}
          </label>
          <select
            id="thread-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {t(cat.nameKey, { defaultValue: cat.slug })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="thread-title" className="mb-1 block text-sm font-medium text-text-secondary">
            {t("forum.threadTitle")}
          </label>
          <input
            id="thread-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("forum.threadTitlePlaceholder")}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder-text-muted"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t("forum.tags")}
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  tagIds.includes(tag.id)
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-muted text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t("forum.body")}
          </label>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder={t("forum.bodyPlaceholder")}
            minRows={8}
          />
        </div>

        <div className="flex gap-3">
          <Link
            to={langPath("community/discuss")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("forum.cancel")}
          </Link>
          <button
            type="submit"
            disabled={!title.trim() || !body.trim() || !categoryId || createMutation.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {t("forum.createThread")}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
