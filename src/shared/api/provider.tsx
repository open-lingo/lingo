import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AdminApi } from "./admin";
import { DecksApi } from "./decks";
import { ProgressApi } from "./progress";
import { SocialApi } from "./social";
import { StoriesApi } from "./stories";
import { UsersApi } from "./users";
import { SrsApi } from "./srs";

interface ApiContext {
  users: UsersApi;
  srs: SrsApi;
  decks: DecksApi;
  stories: StoriesApi;
  admin: AdminApi;
  progress: ProgressApi;
  social: SocialApi;
}

const Ctx = createContext<ApiContext | null>(null);

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

const AUTH0_AUDIENCE =
  (import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined) ?? "";

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0();

  const api = useMemo(() => {
    const getAccessToken = DEV_AUTH_BYPASS
      ? () => Promise.resolve("dev-bypass")
      : () => getAccessTokenSilently({ authorizationParams: { audience: AUTH0_AUDIENCE } });

    const opts = { baseUrl: API_BASE_URL, getAccessToken };

    return {
      users: new UsersApi(opts),
      srs: new SrsApi(opts),
      decks: new DecksApi(opts),
      stories: new StoriesApi(opts),
      admin: new AdminApi(opts),
      progress: new ProgressApi(opts),
      social: new SocialApi(opts),
    };
  }, [getAccessTokenSilently]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Access the API clients. Must be used inside <ApiProvider>. */
export function useApi(): ApiContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApi must be used within <ApiProvider>");
  return ctx;
}

/** Non-throwing variant — returns null outside `<ApiProvider>`. Used by
 *  hooks that have a mock fallback path (e.g. social hooks that don't want
 *  to require an ApiProvider in unit tests). */
export function useApiOptional(): ApiContext | null {
  return useContext(Ctx);
}
