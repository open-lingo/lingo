import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "openlingo-external-content";
const DONE_KEY = "openlingo-external-content-done";

type StoredState = { subscribedIds: string[]; doneIds: string[] };

function loadState(): StoredState {
  try {
    const sub = localStorage.getItem(STORAGE_KEY);
    const done = localStorage.getItem(DONE_KEY);
    return {
      subscribedIds: sub ? (JSON.parse(sub) as string[]) : [],
      doneIds: done ? (JSON.parse(done) as string[]) : [],
    };
  } catch {
    return { subscribedIds: [], doneIds: [] };
  }
}

function saveSubscribed(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function saveDone(ids: string[]) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** LocalStorage-backed subscriptions and done state for external content. */
export function useExternalContentSubscriptions() {
  const [state, setState] = useState<StoredState>(loadState);

  useEffect(() => {
    const handler = () => setState(loadState());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const subscribe = useCallback((id: string) => {
    setState((prev) => {
      if (prev.subscribedIds.includes(id)) return prev;
      const next = [...prev.subscribedIds, id];
      saveSubscribed(next);
      return { ...prev, subscribedIds: next };
    });
  }, []);

  const unsubscribe = useCallback((id: string) => {
    setState((prev) => {
      const next = prev.subscribedIds.filter((x) => x !== id);
      saveSubscribed(next);
      saveDone(prev.doneIds.filter((x) => x !== id));
      return { subscribedIds: next, doneIds: prev.doneIds.filter((x) => x !== id) };
    });
  }, []);

  const toggleDone = useCallback((id: string) => {
    setState((prev) => {
      const done = prev.doneIds.includes(id)
        ? prev.doneIds.filter((x) => x !== id)
        : [...prev.doneIds, id];
      saveDone(done);
      return { ...prev, doneIds: done };
    });
  }, []);

  const isSubscribed = useCallback(
    (id: string) => state.subscribedIds.includes(id),
    [state.subscribedIds]
  );

  const isDone = useCallback(
    (id: string) => state.doneIds.includes(id),
    [state.doneIds]
  );

  return {
    subscribedIds: state.subscribedIds,
    doneIds: state.doneIds,
    subscribe,
    unsubscribe,
    toggleDone,
    isSubscribed,
    isDone,
  };
}
