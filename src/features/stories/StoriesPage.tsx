import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCourseStories, getCommunityStories } from "./storiesData";
import type { Story } from "./storiesData";

type FilterId = "all" | "recent" | "new" | "read";

function filterStories(stories: Story[], filter: FilterId, query: string): Story[] {
  let out = [...stories];
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }
  if (filter === "read") out = out.filter((s) => s.read);
  if (filter === "new") out = out.filter((s) => s.isNew);
  if (filter === "recent")
    out = out.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
    );
  return out;
}

const FILTERS: { id: FilterId; labelKey: string }[] = [
  { id: "all", labelKey: "stories.filterAll" },
  { id: "recent", labelKey: "stories.filterRecent" },
  { id: "new", labelKey: "stories.filterNew" },
  { id: "read", labelKey: "stories.filterRead" },
];

export function StoriesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");

  const learningLanguageId = "ko";

  const courseStories = useMemo(
    () => getCourseStories(learningLanguageId),
    [learningLanguageId]
  );
  const communityStories = useMemo(
    () => getCommunityStories(learningLanguageId),
    [learningLanguageId]
  );

  const filteredCourse = useMemo(
    () => filterStories(courseStories, filter, search),
    [courseStories, filter, search]
  );
  const filteredCommunity = useMemo(
    () => filterStories(communityStories, filter, search),
    [communityStories, filter, search]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("stories.title")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("stories.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-4 lg:w-56">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("stories.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label={t("stories.searchPlaceholder")}
          />
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  filter === f.id
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("stories.courseStories")}
            </h2>
            {filteredCourse.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("stories.noCourseMatch")}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredCourse.map((story) => (
                  <StoryCard key={story.id} story={story} t={t} />
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("stories.communityStories")}
            </h2>
            {filteredCommunity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("stories.noCommunityMatch")}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredCommunity.map((story) => (
                  <StoryCard key={story.id} story={story} t={t} />
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StoryCard({
  story,
  t,
}: {
  story: Story;
  t: (key: string) => string;
}) {
  return (
    <li>
      <Link
        to={`/stories/${story.id}`}
        className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-green-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600"
      >
        <span className="font-medium text-gray-900 dark:text-white">
          {story.title}
        </span>
        {story.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {story.description}
          </p>
        )}
        <div className="mt-2 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
          {story.read && <span>{t("stories.read")}</span>}
          {story.isNew && <span>{t("stories.new")}</span>}
        </div>
      </Link>
    </li>
  );
}
