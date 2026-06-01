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
const OPEN_VALUE = "open";

export function useQuestsModalUrl(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
} {
  const [params, setParams] = useSearchParams();
  const isOpen = params.get(PARAM) === OPEN_VALUE;

  const open = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(PARAM, OPEN_VALUE);
        return next;
      },
      { replace: false },
    );
  }, [setParams]);

  const close = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  return { isOpen, open, close };
}
