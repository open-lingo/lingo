import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FEATURE_FLAGS,
  fetchFeatureFlags,
  type FeatureFlags,
} from "@/shared/config/featureFlags";

const FeatureFlagsContext = createContext<{
  flags: FeatureFlags;
  /** True after initial fetch attempt (success or failure). */
  ready: boolean;
  reload: () => Promise<void>;
} | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const next = await fetchFeatureFlags();
    setFlags(next);
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await fetchFeatureFlags();
      if (!cancelled) {
        setFlags(next);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ flags, ready, reload }),
    [flags, ready, reload]
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return ctx.flags;
}

export function useFeatureFlagsOptional(): FeatureFlags | null {
  return useContext(FeatureFlagsContext)?.flags ?? null;
}

/** True once the provider's initial fetch has resolved (success or
 *  failure) — or true immediately when rendered outside a
 *  `<FeatureFlagsProvider>` (no fetch pending; same "safe default"
 *  contract as `useFeatureFlagsOptional`'s null fallback, so a host page's
 *  test doesn't need a provider just to read this). Consumers that must
 *  not act on a beta-gated decision before flags resolve (e.g.
 *  `LangLayout`'s `:lang` route guard, 2026-09-18) read this instead of
 *  racing the first render against `fetchFeatureFlags()`. */
export function useFeatureFlagsReadyOptional(): boolean {
  const ctx = useContext(FeatureFlagsContext);
  return ctx ? ctx.ready : true;
}
