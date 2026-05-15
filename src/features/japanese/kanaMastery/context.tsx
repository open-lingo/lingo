import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { isKana } from "@/shared/japanese/kanaTable";
import {
  getStore,
  setStore,
  storageKey,
} from "./storage";
import {
  helperHidden,
  newMasteryState,
  type KanaMasteryState,
  type KanaMasteryStore,
} from "./types";

type Ctx = {
  store: KanaMasteryStore;
  registerExposure: (kana: string) => void;
  recordCorrect: (kana: string) => void;
  recordIncorrect: (kana: string) => void;
  isHelperHidden: (kana: string) => boolean;
};

const KanaMasteryContext = createContext<Ctx | null>(null);

/** Per-session exposure dedupe — a kana rendered 10 times in one screen counts once. */
function makeSessionId(): string {
  return Math.random().toString(36).slice(2);
}

export function KanaMasteryProvider({
  children,
  userIdOverride,
}: {
  children: ReactNode;
  /** When set (e.g. from tests), pins the userId for storage scope. */
  userIdOverride?: string | null;
}) {
  const { user } = useAuth();
  const userId = userIdOverride ?? user?.sub ?? null;
  const [store, setLocalStore] = useState<KanaMasteryStore>(() => getStore(userId));
  const sessionIdRef = useRef(makeSessionId());
  const exposedThisSessionRef = useRef<Set<string>>(new Set());

  // Re-hydrate when user identity changes (login/logout).
  useEffect(() => {
    setLocalStore(getStore(userId));
    sessionIdRef.current = makeSessionId();
    exposedThisSessionRef.current = new Set();
  }, [userId]);

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(userId)) return;
      setLocalStore(getStore(userId));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  const persist = useCallback(
    (next: KanaMasteryStore) => {
      setStore(userId, next);
      setLocalStore({ ...next });
    },
    [userId],
  );

  const mutate = useCallback(
    (kana: string, fn: (prev: KanaMasteryState) => KanaMasteryState) => {
      const current = getStore(userId);
      const prev = current[kana] ?? newMasteryState(kana);
      const next = fn(prev);
      const updated = { ...current, [kana]: next };
      persist(updated);
    },
    [userId, persist],
  );

  const registerExposure = useCallback(
    (kana: string) => {
      if (!isKana(kana)) return;
      const sessionKey = `${sessionIdRef.current}:${kana}`;
      if (exposedThisSessionRef.current.has(sessionKey)) return;
      exposedThisSessionRef.current.add(sessionKey);
      mutate(kana, (prev) => ({
        ...prev,
        exposures: prev.exposures + 1,
        lastSeen: new Date().toISOString(),
      }));
    },
    [mutate],
  );

  const recordCorrect = useCallback(
    (kana: string) => {
      if (!isKana(kana)) return;
      mutate(kana, (prev) => {
        const streak = prev.streak + 1;
        // SM-2-ish: stretch interval on streaks. Both conditions in
        // helperHidden are AND-gated, so interval matters.
        const interval =
          streak === 1
            ? 1
            : streak === 2
              ? 3
              : Math.min(60, Math.round(prev.interval * prev.easeFactor || 6));
        const ease = Math.min(2.5, prev.easeFactor + 0.05);
        const due = new Date();
        due.setDate(due.getDate() + interval);
        return {
          ...prev,
          correctCount: prev.correctCount + 1,
          exposures: prev.exposures + 1,
          streak,
          interval,
          easeFactor: ease,
          lastSeen: new Date().toISOString(),
          dueDate: due.toISOString().slice(0, 10),
        };
      });
    },
    [mutate],
  );

  const recordIncorrect = useCallback(
    (kana: string) => {
      if (!isKana(kana)) return;
      mutate(kana, (prev) => ({
        ...prev,
        incorrectCount: prev.incorrectCount + 1,
        exposures: prev.exposures + 1,
        streak: 0,
        interval: 0,
        easeFactor: Math.max(1.3, prev.easeFactor - 0.2),
        lastSeen: new Date().toISOString(),
        dueDate: new Date().toISOString().slice(0, 10),
      }));
    },
    [mutate],
  );

  const isHelperHidden = useCallback(
    (kana: string) => helperHidden(store[kana]),
    [store],
  );

  const value = useMemo<Ctx>(
    () => ({
      store,
      registerExposure,
      recordCorrect,
      recordIncorrect,
      isHelperHidden,
    }),
    [store, registerExposure, recordCorrect, recordIncorrect, isHelperHidden],
  );

  return (
    <KanaMasteryContext.Provider value={value}>
      {children}
    </KanaMasteryContext.Provider>
  );
}

/** Fallback context value for trees not wrapped in the provider — e.g. tests,
 *  shared layouts. Behaves as a no-op tracker; helpers always show. */
const NOOP_CTX: Ctx = {
  store: {},
  registerExposure: () => {},
  recordCorrect: () => {},
  recordIncorrect: () => {},
  isHelperHidden: () => false,
};

export function useKanaMastery(): Ctx {
  return useContext(KanaMasteryContext) ?? NOOP_CTX;
}
