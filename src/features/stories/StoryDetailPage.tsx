import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStoryById } from "./storiesData";

export function StoryDetailPage() {
  const { t } = useTranslation();
  const { storyId } = useParams<{ storyId: string }>();
  const story = storyId ? getStoryById(storyId) : undefined;

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-gray-500 dark:text-gray-400">{t("stories.storyNotFound")}</p>
        <Link to="/stories" className="text-sm text-green-600 dark:text-green-400">
          {t("stories.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/stories"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("stories.back")}
        </Link>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {story.title}
          </h1>
          {story.description && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">{story.description}</p>
          )}
          <div className="mt-2 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{story.source === "course" ? t("stories.courseStories") : t("stories.communityStories")}</span>
            {story.read && <span>· {t("stories.read")}</span>}
            {story.isNew && <span>· {t("stories.new")}</span>}
          </div>
        </header>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">
            {t("stories.contentPlaceholder")}
          </p>
        </div>
      </article>
    </div>
  );
}
