import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { FORUM_CATEGORIES, FORUM_TAGS } from "./mockForum";
import { MarkdownEditor } from "./MarkdownEditor";

export function NewThreadPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(FORUM_CATEGORIES[0]?.id ?? "general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    // Mock: would POST to API
    navigate(langPath("community/discuss"));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={langPath("community")} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          ← {t("community.title")}
        </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t("forum.newThread")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="thread-category" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("forum.category")}
          </label>
          <select
            id="thread-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {FORUM_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {t(cat.nameKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="thread-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("forum.threadTitle")}
          </label>
          <input
            id="thread-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("forum.threadTitlePlaceholder")}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("forum.tags")}
          </label>
          <div className="flex flex-wrap gap-2">
            {FORUM_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  tagIds.includes(tag.id)
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("forum.cancel")}
          </Link>
          <button
            type="submit"
            disabled={!title.trim() || !body.trim()}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("forum.createThread")}
          </button>
        </div>
      </form>
    </div>
  );
}
