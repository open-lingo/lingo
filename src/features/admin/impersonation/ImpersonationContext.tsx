import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getImpersonation,
  subscribeImpersonation,
  type ImpersonationState,
} from "@/shared/auth/impersonation";

/**
 * Thin React context over the sessionStorage-backed impersonation state.
 *
 * Source of truth lives in ``shared/auth/impersonation`` so the
 * ApiClient (which doesn't live in the React tree) can read it
 * synchronously per request. This context just provides a render-time
 * subscription for the banner + any UI that wants to react to
 * start/stop without prop-drilling.
 *
 * Why a context AND a module-level store: the API client needs sync
 * access from arbitrary code, but React components need re-renders
 * when state changes. The store handles both.
 */

interface ImpersonationContextValue {
  state: ImpersonationState | null;
}

const Ctx = createContext<ImpersonationContextValue>({ state: null });

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonationState | null>(() =>
    getImpersonation(),
  );

  useEffect(() => {
    // Subscribe to start/stop. The setter from setImpersonation /
    // clearImpersonation will fire and re-render anything reading via
    // ``useImpersonation``.
    return subscribeImpersonation((next) => setState(next));
  }, []);

  return <Ctx.Provider value={{ state }}>{children}</Ctx.Provider>;
}

export function useImpersonation(): ImpersonationState | null {
  return useContext(Ctx).state;
}
