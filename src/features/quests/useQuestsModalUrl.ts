import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * URL-driven open state for the QuestsPanel modal.
 *
 * Reads ``?quests=open`` from the search params so any link / nav can
 * pop the modal — including direct URLs like ``/ja/learn?quests=open``.
 * Closing flips it back off without touching the rest of the URL.
 *
 * Why URL-driven instead of local useState: the modal needs to be
 * reachable from anywhere (top-bar pill, sidebar pill, deep links,
 * upcoming dev/admin tools that just want to "open the quests UI").
 * Sharing state through the URL is the cheapest coordination point.
 */
const PARAM = "quests";
const TAB_PARAM = "questsTab";
const OPEN_VALUE = "open";

export type QuestsTab = "all" | "daily" | "weekly" | "random" | "friend";

const VALID_TABS: ReadonlySet<QuestsTab> = new Set([
  "all",
  "daily",
  "weekly",
  "random",
  "friend",
]);

export function useQuestsModalUrl(): {
  isOpen: boolean;
  tab: QuestsTab;
  open: (tab?: QuestsTab) => void;
  close: () => void;
} {
  const [params, setParams] = useSearchParams();
  const isOpen = params.get(PARAM) === OPEN_VALUE;
  const rawTab = params.get(TAB_PARAM);
  const tab: QuestsTab = (
    rawTab && VALID_TABS.has(rawTab as QuestsTab) ? rawTab : "all"
  ) as QuestsTab;

  const open = useCallback(
    (nextTab?: QuestsTab) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(PARAM, OPEN_VALUE);
          if (nextTab) next.set(TAB_PARAM, nextTab);
          else next.delete(TAB_PARAM);
          return next;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  const close = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PARAM);
        next.delete(TAB_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  return { isOpen, tab, open, close };
}
