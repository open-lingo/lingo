import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AdminApi } from "./admin";
import { AdsApi } from "./ads";
import { CommunityApi } from "./community";
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
import { getImpersonationTargetId } from "@/shared/auth/impersonation";
import { AUTH_BYPASS, BYPASS_TOKEN } from "@/shared/auth/bypass";
import { ApiClient } from "./client";
import { registerBootFetcher, type BootData } from "./bootCache";

/** One endpoint only — the batched boot read the bootCache serves from. */
class BootApi extends ApiClient {
  getBoot(): Promise<BootData> {
    return this.get<BootData>("/api/core/v1/boot");
  }
}

interface ApiContext {
  users: UsersApi;
  srs: SrsApi;
  decks: DecksApi;
  stories: StoriesApi;
  admin: AdminApi;
  ads: AdsApi;
  progress: ProgressApi;
  quests: QuestsApi;
  social: SocialApi;
  community: CommunityApi;
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

// Token shim for the bypassed sessions. Imported rather than re-derived: this
// check MUST agree with the one `useAuth` makes, or the app renders a
// signed-in UI whose every request throws for want of an Auth0 session.
// See `shared/auth/bypass.ts` for what each door is gated on.

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessTokenSilently } = useAuth0();

  const api = useMemo(() => {
    const getAccessToken = AUTH_BYPASS
      ? () => Promise.resolve(BYPASS_TOKEN)
      : () => getAccessTokenSilently({ authorizationParams: { audience: AUTH0_AUDIENCE } });

    // Re-read sessionStorage on every request — banner Stop/Start mutates
    // it live and the next API call must reflect the new state without
    // rebuilding the client.
    const opts = {
      baseUrl: API_BASE_URL,
      getAccessToken,
      getImpersonationTargetId,
      // A bypass build holds only BYPASS_TOKEN, which the server rejects, so
      // every authed request can only 401. Short-circuit them to instant
      // local-first fallback instead of stalling first paint on cold-Lambda
      // round-trips (see bypass.ts SERVER_SYNC_ENABLED).
      offline: AUTH_BYPASS,
    };

    // Boot batching: the first boot-wave request through any client below
    // triggers ONE GET /boot and the rest of the wave is answered from its
    // payload (bootCache.ts). Registered here — lazily kicked from
    // ApiClient — because child effects run before parent effects, so a
    // provider-side prefetch would lose the race against the hooks. A bypass
    // build has nothing to boot from (every fetch 401s), so skip it.
    if (!AUTH_BYPASS) {
      const bootApi = new BootApi(opts);
      registerBootFetcher(() => bootApi.getBoot());
    }

    return {
      users: new UsersApi(opts),
      srs: new SrsApi(opts),
      decks: new DecksApi(opts),
      stories: new StoriesApi(opts),
      admin: new AdminApi(opts),
      ads: new AdsApi(opts),
      progress: new ProgressApi(opts),
      quests: new QuestsApi(opts),
      social: new SocialApi(opts),
      community: new CommunityApi(opts),
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
      // OpsApi deliberately skips impersonation: the admin should always
      // hit the ops API as themselves so admin-gated routes resolve
      // correctly even mid-impersonation.
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
