import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AdminApi } from "./admin";
import { DecksApi } from "./decks";
import { StoriesApi } from "./stories";
import { UsersApi } from "./users";
import { SrsApi } from "./srs";

interface ApiContext {
  users: UsersApi;
  srs: SrsApi;
  decks: DecksApi;
  stories: StoriesApi;
  admin: AdminApi;
}

const Ctx = createContext<ApiContext | null>(null);

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

const AUTH0_AUDIENCE =
  (import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined) ?? "";

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0();

  const api = useMemo(() => {
    const getAccessToken = () =>
      getAccessTokenSilently({ authorizationParams: { audience: AUTH0_AUDIENCE } });

    const opts = { baseUrl: API_BASE_URL, getAccessToken };

    return {
      users: new UsersApi(opts),
      srs: new SrsApi(opts),
      decks: new DecksApi(opts),
      stories: new StoriesApi(opts),
      admin: new AdminApi(opts),
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
