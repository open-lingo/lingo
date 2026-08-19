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
import { getStore, setStore, storageKey } from "./storage";
import {
  helperHidden,
  newMasteryState,
  type SymbolMasteryState,
  type SymbolMasteryStore,
} from "./types";

type Ctx = {
  store: SymbolMasteryStore;
  registerExposure: (symbol: string) => void;
  recordCorrect: (symbol: string) => void;
  recordIncorrect: (symbol: string) => void;
  isHelperHidden: (symbol: string) => boolean;
};

const SymbolMasteryContext = createContext<Ctx | null>(null);

/** Per-session exposure dedupe — a symbol rendered 10 times in one screen counts once. */
function makeSessionId(): string {
  return Math.random().toString(36).slice(2);
}

export function SymbolMasteryProvider({
  children,
  userIdOverride,
  isSymbol,
  storageKeyPrefix,
}: {
  children: ReactNode;
  /** When set (e.g. from tests), pins the userId for storage scope. */
  userIdOverride?: string | null;
  /** Validator: returns true if the input string is a recognized symbol of this language. */
  isSymbol: (s: string) => boolean;
  /** Optional localStorage key prefix. Default preserves JA's pre-extraction `kanaMastery:v1:` shape. */
  storageKeyPrefix?: string;
}) {
  const { user } = useAuth();
  const userId = userIdOverride ?? user?.sub ?? null;
  const [store, setLocalStore] = useState<SymbolMasteryStore>(() =>
    getStore(userId, storageKeyPrefix),
  );
  const sessionIdRef = useRef(makeSessionId());
  const exposedThisSessionRef = useRef<Set<string>>(new Set());

  // Re-hydrate when user identity changes (login/logout).
  useEffect(() => {
    setLocalStore(getStore(userId, storageKeyPrefix));
    sessionIdRef.current = makeSessionId();
    exposedThisSessionRef.current = new Set();
  }, [userId, storageKeyPrefix]);

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(userId, storageKeyPrefix)) return;
      setLocalStore(getStore(userId, storageKeyPrefix));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId, storageKeyPrefix]);

  const persist = useCallback(
    (next: SymbolMasteryStore) => {
      setStore(userId, next, storageKeyPrefix);
      setLocalStore({ ...next });
    },
    [userId, storageKeyPrefix],
  );

  const mutate = useCallback(
    (
      symbol: string,
      fn: (prev: SymbolMasteryState) => SymbolMasteryState,
    ) => {
      const current = getStore(userId, storageKeyPrefix);
      const prev = current[symbol] ?? newMasteryState(symbol);
      const next = fn(prev);
      const updated = { ...current, [symbol]: next };
      persist(updated);
    },
    [userId, persist, storageKeyPrefix],
  );

  const registerExposure = useCallback(
    (symbol: string) => {
      if (!isSymbol(symbol)) return;
      const sessionKey = `${sessionIdRef.current}:${symbol}`;
      if (exposedThisSessionRef.current.has(sessionKey)) return;
      exposedThisSessionRef.current.add(sessionKey);
      mutate(symbol, (prev) => ({
        ...prev,
        exposures: prev.exposures + 1,
        lastSeen: new Date().toISOString(),
      }));
    },
    [mutate, isSymbol],
  );

  const recordCorrect = useCallback(
    (symbol: string) => {
      if (!isSymbol(symbol)) return;
      mutate(symbol, (prev) => {
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
    [mutate, isSymbol],
  );

  const recordIncorrect = useCallback(
    (symbol: string) => {
      if (!isSymbol(symbol)) return;
      mutate(symbol, (prev) => ({
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
    [mutate, isSymbol],
  );

  const isHelperHidden = useCallback(
    (symbol: string) => helperHidden(store[symbol]),
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
    <SymbolMasteryContext.Provider value={value}>
      {children}
    </SymbolMasteryContext.Provider>
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

export function useSymbolMastery(): Ctx {
  return useContext(SymbolMasteryContext) ?? NOOP_CTX;
}

/**
 * Whether a real provider is mounted above, as opposed to the NOOP fallback.
 *
 * `useSymbolMastery` deliberately never throws, which makes "no provider"
 * indistinguishable from "provider with nothing mastered" at the call site.
 * A wrapper that wants to supply a provider ONLY when one is missing needs
 * to tell those apart — nesting two is not free, since each holds its own
 * `useState` copy of the store and writes it back to the same localStorage
 * key (last writer wins, silently). See `LessonStepEnvironment`.
 */
export function useHasSymbolMastery(): boolean {
  return useContext(SymbolMasteryContext) !== null;
}
