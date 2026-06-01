import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AdminApi } from "./admin";
import { DecksApi } from "./decks";
import { FinanceApi } from "./finance";
import { OpsApi } from "./ops";
import { ProgressApi } from "./progress";
import { QuestsApi } from "./quests";
import { SocialApi } from "./social";
import { StoriesApi } from "./stories";
import { TagsApi } from "./tags";
import { UsersApi } from "./users";
import { SrsApi } from "./srs";

interface ApiContext {
  users: UsersApi;
  srs: SrsApi;
  decks: DecksApi;
  stories: StoriesApi;
  admin: AdminApi;
  progress: ProgressApi;
  quests: QuestsApi;
  social: SocialApi;
  /** Public endpoints — no Auth0 token, fires immediately on first paint. */
  finance: FinanceApi;
  /**
   * Canonical deck tag dictionary (admin-curated). Public read, skips
   * auth so the community-browse facet sidebar can paint without
   * waiting on an Auth0 token. Admin mutations go through `AdminApi`
   * once that surface is wired (follow-up).
   */
  tags: TagsApi;
  /**
   * lingo-ops admin API. Hits a different host than lingo-core
   * (VITE_OPS_API_BASE_URL, default localhost:8001 for local dev).
   * Auth0 JWT auto-attaches; backend admin gate is environment-driven
   * via ADMIN_USER_IDS on lingo-ops.
   */
  ops: OpsApi;
}

const Ctx = createContext<ApiContext | null>(null);

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

const OPS_API_BASE_URL =
  (import.meta.env.VITE_OPS_API_BASE_URL as string | undefined) ?? "http://localhost:8001";

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
      quests: new QuestsApi(opts),
      social: new SocialApi(opts),
      // FinanceApi hits public endpoints — skip auth so the funding meter
      // can paint without blocking on Auth0 (and works for signed-out users).
      finance: new FinanceApi({
        baseUrl: API_BASE_URL,
        getAccessToken: () => Promise.resolve(""),
        skipAuth: true,
      }),
      // Tags list endpoint is public too — same pattern as FinanceApi so the
      // community-browse facet chips can render for signed-out users.
      tags: new TagsApi({
        baseUrl: API_BASE_URL,
        getAccessToken: () => Promise.resolve(""),
        skipAuth: true,
      }),
      ops: new OpsApi({ baseUrl: OPS_API_BASE_URL, getAccessToken }),
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
