import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useApi } from "@/shared/api/provider";
import type { StoryResponse } from "@/shared/api/stories";

type FilterId = "all" | "recent" | "new" | "read";

/** Story for display — from API. */
type DisplayStory = {
  id: string;
  title: string;
  description?: string;
  languageId: string;
  isSubscribed?: boolean;
  updatedAt?: string;
  companionDeckId?: string;
  body?: string;
};

function filterStories(
  stories: DisplayStory[],
  filter: FilterId,
  query: string
): DisplayStory[] {
  let out = [...stories];
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }
  if (filter === "read" || filter === "new") {
    /* read/new filters need progress data — not yet from API */
  }
  if (filter === "recent")
    out = out.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() -
        new Date(a.updatedAt ?? 0).getTime()
    );
  return out;
}

const FILTERS: { id: FilterId; labelKey: string }[] = [
  { id: "all", labelKey: "stories.filterAll" },
  { id: "recent", labelKey: "stories.filterRecent" },
  { id: "new", labelKey: "stories.filterNew" },
  { id: "read", labelKey: "stories.filterRead" },
];

function apiToDisplay(s: StoryResponse, isSubscribed?: boolean): DisplayStory {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    languageId: s.languageId,
    isSubscribed,
    updatedAt: s.updatedAt ?? s.createdAt,
    companionDeckId: s.companionDeckId,
    body: s.body,
  };
}

export function StoriesPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { stories: storiesApi, users: usersApi } = useApi();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "subscribed">("browse");

  const learningLanguageId = language?.id ?? "ko";

  const [apiStories, setApiStories] = useState<StoryResponse[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [subscribedStories, setSubscribedStories] = useState<
    { story: StoryResponse; subId: string }[]
  >([]);
  const [subscribedLoading, setSubscribedLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    setApiLoading(true);
    storiesApi
      .listBrowseStories({ language_id: learningLanguageId })
      .then((list) => {
        if (ok) setApiStories(list);
      })
      .catch(() => {
        if (ok) setApiStories([]);
      })
      .finally(() => {
        if (ok) setApiLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [storiesApi, learningLanguageId]);

  const refreshSubscriptions = useCallback(() => {
    usersApi
      .getSubscriptions({ contentType: "story" })
      .then(async (subs) => {
        const results: { story: StoryResponse; subId: string }[] = [];
        for (const s of subs) {
          try {
            const story = await storiesApi.getStory(s.contentId);
            results.push({ story, subId: s.contentId });
          } catch {
            /* skip unavailable */
          }
        }
        setSubscribedStories(results);
      })
      .catch(() => setSubscribedStories([]))
      .finally(() => setSubscribedLoading(false));
  }, [usersApi, storiesApi]);

  useEffect(() => {
    let ok = true;
    setSubscribedLoading(true);
    usersApi
      .getSubscriptions({ contentType: "story" })
      .then(async (subs) => {
        const results: { story: StoryResponse; subId: string }[] = [];
        for (const s of subs) {
          if (!ok) return;
          try {
            const story = await storiesApi.getStory(s.contentId);
            if (ok) results.push({ story, subId: s.contentId });
          } catch {
            /* skip unavailable */
          }
        }
        if (ok) setSubscribedStories(results);
      })
      .catch(() => {
        if (ok) setSubscribedStories([]);
      })
      .finally(() => {
        if (ok) setSubscribedLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [usersApi, storiesApi]);

  const subscribedIds = useMemo(
    () => new Set(subscribedStories.map((s) => s.story.id)),
    [subscribedStories]
  );

  const browseStories = useMemo(
    () =>
      apiStories.map((s) => apiToDisplay(s, subscribedIds.has(s.id))),
    [apiStories, subscribedIds]
  );

  const subscribedDisplayStories = useMemo(
    () =>
      subscribedStories.map(({ story }) =>
        apiToDisplay(story, true)
      ),
    [subscribedStories]
  );

  const filteredBrowse = useMemo(
    () => filterStories(browseStories, filter, search),
    [browseStories, filter, search]
  );
  const filteredSubscribed = useMemo(
    () => filterStories(subscribedDisplayStories, filter, search),
    [subscribedDisplayStories, filter, search]
  );

  const handleSubscribe = (storyId: string) => {
    setSubscribeLoading(storyId);
    usersApi
      .addSubscription({ contentType: "story", contentId: storyId })
      .then(() => refreshSubscriptions())
      .finally(() => setSubscribeLoading(null));
  };

  const handleUnsubscribe = (storyId: string) => {
    setSubscribeLoading(storyId);
    usersApi
      .removeSubscription("story", storyId)
      .then(() => refreshSubscriptions())
      .finally(() => setSubscribeLoading(null));
  };

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

      <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("browse")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "browse"
              ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
              : "-mb-px border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("community.contentBrowserTabBrowse")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscribed")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "subscribed"
              ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
              : "-mb-px border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("community.contentBrowserTabSubscribed")}
        </button>
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
          {activeTab === "subscribed" && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("stories.subscribedStories")}
              </h2>
              {subscribedLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("common.loading")}
                </p>
              ) : filteredSubscribed.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("stories.noSubscribedStories")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredSubscribed.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      t={t}
                      langPath={langPath}
                      isSubscribed
                      onSubscribe={() => handleSubscribe(story.id)}
                      onUnsubscribe={() => handleUnsubscribe(story.id)}
                      subscribeLoading={subscribeLoading === story.id}
                      canSubscribe
                    />
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeTab === "browse" && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t("stories.communityStories")}
              </h2>
              {apiLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("common.loading")}
                </p>
              ) : filteredBrowse.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("stories.noCommunityMatch")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredBrowse.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      t={t}
                      langPath={langPath}
                      isSubscribed={story.isSubscribed}
                      onSubscribe={() => handleSubscribe(story.id)}
                      onUnsubscribe={() => handleUnsubscribe(story.id)}
                      subscribeLoading={subscribeLoading === story.id}
                      canSubscribe
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function StoryCard({
  story,
  t,
  langPath,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  subscribeLoading,
  canSubscribe,
}: {
  story: DisplayStory;
  t: (key: string) => string;
  langPath: (p: string) => string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  subscribeLoading?: boolean;
  canSubscribe?: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-green-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600">
      <Link
        to={langPath(`practice/stories/${story.id}`)}
        className="min-w-0 flex-1"
      >
        <span className="font-medium text-gray-900 dark:text-white">
          {story.title}
        </span>
        {story.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {story.description}
          </p>
        )}
        <div className="mt-2 flex gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{t("stories.communityStories")}</span>
        </div>
      </Link>
      {canSubscribe && (
        <button
          type="button"
          disabled={subscribeLoading}
          onClick={(e) => {
            e.preventDefault();
            if (isSubscribed) onUnsubscribe?.();
            else onSubscribe?.();
          }}
          className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition ${
            isSubscribed
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          }`}
        >
          {subscribeLoading ? "…" : isSubscribed ? t("community.contentBrowserSubscribed") : t("community.contentBrowserSubscribe")}
        </button>
      )}
    </li>
  );
}
