import { useSearchParams } from "react-router-dom";
import { CommunityLibraryLayout, type LibraryTabId } from "./CommunityLibraryLayout";
import { SubscribedBody } from "./SubscribedPage";
import { MyDecksBody } from "./MyDecksPage";

const VALID_TABS: LibraryTabId[] = ["subscribed", "mine"];

/**
 * LibraryPage — the personal area of community (subscriptions + authored
 * decks), distinct from the discovery surface. Tab state is URL-driven via
 * `?tab=`; the default (subscribed) is unrepresented in the URL.
 */
export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LibraryTabId =
    tabParam && (VALID_TABS as string[]).includes(tabParam)
      ? (tabParam as LibraryTabId)
      : "subscribed";

  const setTab = (tab: LibraryTabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "subscribed") next.delete("tab");
        else next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <CommunityLibraryLayout activeTab={activeTab} onTabChange={setTab}>
      {activeTab === "mine" ? <MyDecksBody /> : <SubscribedBody />}
    </CommunityLibraryLayout>
  );
}
