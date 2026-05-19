import { useState, useCallback } from "react";
import { useApi } from "@/shared/api/provider";

export type BrowseSubscribedTab = "browse" | "subscribed" | "mine";

/**
 * Shared hook for Browse | Subscribed | Mine tab UIs (ContentBrowserPage, StoriesPage).
 * Manages active tab, search, and subscribe/unsubscribe with loading state.
 */
export function useBrowseSubscribedContent(options: {
  onRefresh: () => void;
}) {
  const { users } = useApi();
  const [activeTab, setActiveTab] = useState<BrowseSubscribedTab>("browse");
  const [search, setSearch] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);

  const handleSubscribe = useCallback(
    (contentType: "deck" | "story", contentId: string) => {
      setSubscribeLoading(contentId);
      users
        .addSubscription({ contentType, contentId })
        .then(() => options.onRefresh())
        .finally(() => setSubscribeLoading(null));
    },
    [users, options.onRefresh]
  );

  const handleUnsubscribe = useCallback(
    (contentType: "deck" | "story", contentId: string) => {
      setSubscribeLoading(contentId);
      users
        .removeSubscription(contentType, contentId)
        .then(() => options.onRefresh())
        .finally(() => setSubscribeLoading(null));
    },
    [users, options.onRefresh]
  );

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    subscribeLoading,
    handleSubscribe,
    handleUnsubscribe,
  };
}
