import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AdProvider } from "./types";
import { FakeAdProvider } from "./FakeAdProvider";
import { AdSenseAdProvider } from "./AdSenseAdProvider";

/**
 * Singleton default so an un-wrapped tree (e.g. tests, storybook,
 * components rendered above the provider) still gets a usable
 * placeholder rather than crashing.
 */
const DEFAULT_PROVIDER: AdProvider = new FakeAdProvider();

export const AdProviderContext = createContext<AdProvider>(DEFAULT_PROVIDER);

export function useAdProvider(): AdProvider {
  return useContext(AdProviderContext);
}

export type AdProviderId = "adsense" | "fake";

export type SelectProviderInput = {
  /** Test/runtime override; bypasses env. */
  override?: AdProviderId;
  /** Read from `import.meta.env` by callers; passed in for testability. */
  env?: Record<string, string | undefined>;
};

function isAdProviderId(value: string | undefined): value is AdProviderId {
  return value === "adsense" || value === "fake";
}

/**
 * Pick a default provider. Order:
 *   1. explicit `override` (used by `<AdProviderRoot providerOverride>`)
 *   2. `VITE_AD_PROVIDER` env (`"adsense"` or `"fake"`)
 *   3. auto: `"adsense"` when `VITE_ADSENSE_CLIENT` is set, else `"fake"`.
 *
 * Unknown env values are ignored (fall through to auto).
 */
export function selectDefaultProvider(input: SelectProviderInput = {}): AdProvider {
  const env = input.env ?? {};

  if (input.override) {
    return instantiate(input.override);
  }

  const explicit = env.VITE_AD_PROVIDER?.trim();
  if (isAdProviderId(explicit)) {
    return instantiate(explicit);
  }

  // Auto: prefer AdSense when a client id is configured.
  const hasClient = Boolean(env.VITE_ADSENSE_CLIENT?.trim());
  return instantiate(hasClient ? "adsense" : "fake");
}

function instantiate(id: AdProviderId): AdProvider {
  switch (id) {
    case "adsense":
      return new AdSenseAdProvider();
    case "fake":
    default:
      return new FakeAdProvider();
  }
}

/**
 * Mounts the provider for the React tree. Pass `providerOverride` in
 * tests to force a specific provider regardless of env.
 */
export function AdProviderRoot({
  children,
  providerOverride,
}: {
  children: ReactNode;
  providerOverride?: AdProvider;
}) {
  const provider = useMemo<AdProvider>(() => {
    if (providerOverride) return providerOverride;
    return selectDefaultProvider({
      env: {
        VITE_AD_PROVIDER: import.meta.env.VITE_AD_PROVIDER as string | undefined,
        VITE_ADSENSE_CLIENT: import.meta.env.VITE_ADSENSE_CLIENT as string | undefined,
      },
    });
  }, [providerOverride]);

  return (
    <AdProviderContext.Provider value={provider}>{children}</AdProviderContext.Provider>
  );
}
