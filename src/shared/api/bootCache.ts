/**
 * Boot batching — collapse the client's boot request wave into one call.
 *
 * Why (measured in prod, 2026-08-15): on app open the hooks fire six authed
 * requests within ~5 ms of each other (`users/me`, `settings`,
 * `progress/me`, `unlocks`, `touch`, `srs/state`, then `quests` +
 * `subscriptions` shortly after). Six *concurrent* Lambda requests fan out
 * to six instances — a cold morning paid ~2.4–2.9 s cold start on EVERY one
 * of them, and even warm each pays ~0.6 s of invoke overhead. The backend
 * now exposes `GET /api/core/v1/boot` returning all eight payloads in one
 * invoke; this module makes the client use it WITHOUT touching any hook or
 * query key.
 *
 * How: `ApiClient._request` consults `serveFromBoot` before fetching. The
 * FIRST request for a boot-covered path triggers the single `/boot` fetch
 * (lazy kickoff — deliberately not a provider effect: React runs child
 * effects before parent effects, so a provider-side prefetch reliably
 * LOSES the race against the very hooks it is meant to feed). Every other
 * covered request that arrives while `/boot` is in flight awaits it and is
 * answered from its payload.
 *
 * Safety rails:
 * - **Single-use per path.** A boot section answers exactly one request —
 *   the one that used to be the boot fetch for that endpoint. Refetches
 *   (e.g. an invalidation after a lesson-complete XP award) must see the
 *   network, never a stale boot snapshot.
 * - **One shot per impersonation target.** The whole batching happens at
 *   most once per acting-user per page load; an admin starting/stopping
 *   impersonation gets a fresh (or no) batch, and requests whose acting
 *   user differs from the batch's are never served from it.
 * - **Only bare paths.** A query string (e.g. `?content_type=deck`) always
 *   misses — /boot carries the unfiltered variants only.
 * - **Failure falls through.** If `/boot` 404s (brand-new user — the
 *   create-user flow relies on that 404) or errors, every waiter proceeds
 *   to its individual endpoint exactly as before this module existed.
 */

/** Sections of the /boot payload, keyed by "METHOD /path-after-api-base". */
const SECTION_BY_REQUEST: Record<string, keyof BootData> = {
  "GET /users/me": "user",
  "GET /users/me/settings": "settings",
  "GET /progress/me": "progress",
  "GET /progress/me/unlocks": "unlocks",
  "POST /progress/me/touch": "touch",
  "GET /srs/state": "srs",
  "GET /quests": "quests",
  "GET /users/me/subscriptions": "subscriptions",
};

const API_PATH_PREFIX = "/api/core/v1";

export interface BootData {
  user: unknown;
  settings: unknown;
  progress: unknown;
  unlocks: unknown;
  touch: unknown;
  srs: unknown;
  quests: unknown;
  subscriptions: unknown;
}

type BootFetcher = () => Promise<BootData>;

let fetcher: BootFetcher | null = null;

interface BootFlight {
  promise: Promise<BootData | null>;
  target: string | null; // impersonation target the batch was fetched as
  served: Set<string>;
}

let flight: BootFlight | null = null;
/** Targets we already batched for — one /boot per acting user per page load. */
const attempted = new Set<string | null>();

/** Registered by ApiProvider; re-registration (client rebuild) is fine. */
export function registerBootFetcher(fn: BootFetcher): void {
  fetcher = fn;
}

/** Test/impersonation hook: forget everything, allow one fresh batch. */
export function resetBootCache(): void {
  flight = null;
  attempted.clear();
}

/** Sentinel for "not answered by the batch — go to the network". */
export const BOOT_MISS: unique symbol = Symbol("boot-miss");
const MISS = BOOT_MISS;

/**
 * Answer `method url` from the boot batch, or resolve to the MISS sentinel.
 * Exposed to ApiClient only; everything else goes through the normal fetch.
 */
export async function serveFromBoot(
  method: string,
  url: string,
  impersonationTarget: string | null,
): Promise<unknown | typeof BOOT_MISS> {
  const key = requestKey(method, url);
  if (!key) return MISS;

  if (!flight) {
    if (!fetcher || attempted.has(impersonationTarget)) return MISS;
    attempted.add(impersonationTarget);
    const f: BootFlight = {
      target: impersonationTarget,
      served: new Set(),
      promise: fetcher().catch(() => null),
    };
    flight = f;
  }

  if (flight.target !== impersonationTarget) return MISS;
  if (flight.served.has(key)) return MISS;
  // Claim BEFORE awaiting: two concurrent requests for the same path must
  // not both be answered from one snapshot (the second is a real refetch).
  flight.served.add(key);

  const data = await flight.promise;
  const section = data?.[SECTION_BY_REQUEST[key]];
  // null/undefined section (best-effort quests/subscriptions, failed boot):
  // fall through to the network.
  return section ?? MISS;
}

function requestKey(method: string, url: string): string | null {
  let pathname: string;
  let hasQuery: boolean;
  try {
    const u = new URL(url);
    pathname = u.pathname;
    hasQuery = u.search.length > 0;
  } catch {
    return null;
  }
  if (hasQuery) return null;
  const idx = pathname.indexOf(API_PATH_PREFIX);
  if (idx === -1) return null;
  const rel = pathname.slice(idx + API_PATH_PREFIX.length);
  const key = `${method} ${rel}`;
  return key in SECTION_BY_REQUEST ? key : null;
}
