import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const SRS_STORE_CHANGED = "srs-store-changed";

const SRSStoreRevisionContext = createContext<number>(0);

/**
 * Provider that bumps a revision when the SRS store is updated (e.g. after sync).
 * Components that derive due counts/queues from getSRSStore() should use
 * useSRSStoreRevision() in their dependency arrays so they re-compute when the store changes.
 */
export function SRSStoreRevisionProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const handler = () => setRevision((r) => r + 1);
    window.addEventListener(SRS_STORE_CHANGED, handler);
    return () => window.removeEventListener(SRS_STORE_CHANGED, handler);
  }, []);

  return (
    <SRSStoreRevisionContext.Provider value={revision}>
      {children}
    </SRSStoreRevisionContext.Provider>
  );
}

export function useSRSStoreRevision(): number {
  return useContext(SRSStoreRevisionContext) ?? 0;
}

/** Dispatched by engine when local SRS store is updated (e.g. after performSync). */
export function notifySRSStoreChanged(): void {
  window.dispatchEvent(new CustomEvent(SRS_STORE_CHANGED));
}
