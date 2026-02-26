import { useState, useMemo, useEffect, useCallback } from "react";
import { CommunityItemCard } from "@/features/community/components/CommunityItemCard";
import { useBrowseSubscribedContent } from "@/features/community/useBrowseSubscribedContent";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { TabList, TabButton } from "@/shared/components/ui/Tabs";
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

  const learningLanguageId = language?.id ?? "ko";

  const [apiStories, setApiStories] = useState<StoryResponse[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [subscribedStories, setSubscribedStories] = useState<
    { story: StoryResponse; subId: string }[]
  >([]);
  const [subscribedLoading, setSubscribedLoading] = useState(true);

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

  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    subscribeLoading,
    handleSubscribe: handleSubscribeBase,
    handleUnsubscribe: handleUnsubscribeBase,
  } = useBrowseSubscribedContent({ onRefresh: refreshSubscriptions });

  const handleSubscribe = (storyId: string) => handleSubscribeBase("story", storyId);
  const handleUnsubscribe = (storyId: string) => handleUnsubscribeBase("story", storyId);

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


  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("stories.title")}
        </h1>
        <p className="mt-1 text-text-secondary">
          {t("stories.subtitle")}
        </p>
      </div>

      <div className="mb-4">
        <TabList>
          <TabButton
            isActive={activeTab === "browse"}
            onClick={() => setActiveTab("browse")}
          >
            {t("community.contentBrowserTabBrowse")}
          </TabButton>
          <TabButton
            isActive={activeTab === "subscribed"}
            onClick={() => setActiveTab("subscribed")}
          >
            {t("community.contentBrowserTabSubscribed")}
          </TabButton>
        </TabList>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 space-y-4 lg:w-56">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("stories.searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
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
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border bg-surface text-text-secondary"
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
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("stories.subscribedStories")}
              </h2>
              {subscribedLoading ? (
                <p className="text-sm text-text-muted">
                  {t("common.loading")}
                </p>
              ) : filteredSubscribed.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("stories.noSubscribedStories")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredSubscribed.map((story) => (
                    <CommunityItemCard
                      key={story.id}
                      item={{
                        id: story.id,
                        name: story.title,
                        description: story.description ?? "",
                        languageId: story.languageId,
                        kind: "story",
                        storyId: story.id,
                      }}
                      variant="minimal"
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
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("stories.communityStories")}
              </h2>
              {apiLoading ? (
                <p className="text-sm text-text-muted">
                  {t("common.loading")}
                </p>
              ) : filteredBrowse.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("stories.noCommunityMatch")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredBrowse.map((story) => (
                    <CommunityItemCard
                      key={story.id}
                      item={{
                        id: story.id,
                        name: story.title,
                        description: story.description ?? "",
                        languageId: story.languageId,
                        kind: "story",
                        storyId: story.id,
                      }}
                      variant="minimal"
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

