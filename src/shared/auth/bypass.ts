import { IS_NATIVE } from "@/shared/platform/native";

/**
 * The two ways this app is allowed to run without a real Auth0 session, and the
 * fake identity it runs as. Single home for both, because the check has to
 * agree in `useAuth` (is the user signed in?) and `ApiProvider` (what token do
 * we send?) — and a build where those two disagree is a build that renders a
 * signed-in UI whose every request 401s.
 *
 * ── Dev bypass ──────────────────────────────────────────────────────────────
 * Gated on `import.meta.env.DEV`, which Vite hard-codes to `false` for
 * `vite build`. A stray `VITE_DEV_AUTH_BYPASS=true` therefore cannot reach a
 * production bundle — the branch is dead-code-eliminated.
 *
 * ── Native bypass ───────────────────────────────────────────────────────────
 * `vite build --mode native` IS a production build (`DEV === false`), so the
 * dev gate above rules it out; the iOS wrapper needs its own door. It exists so
 * hardware testing — layout under the notch, the lesson player on a real
 * screen — doesn't block on somebody creating an Auth0 Native application.
 *
 * ⚠️ This is the one bypass that CAN ship in a production build, so it is
 * fenced deliberately:
 *   1. `IS_NATIVE` — false in every browser, so no web build can enable it
 *      even if the env var leaks into one.
 *   2. `VITE_NATIVE_AUTH_BYPASS` — a variable that appears ONLY in
 *      `.env.native`, which is gitignored and never set in CI or the deploy
 *      workflow. It is not in `.env`, so no ordinary build sees it.
 *   3. `AuthBypassBadge` paints a permanent marker on screen, so a bypassed
 *      build cannot be mistaken for a real one in a screenshot or a demo.
 *
 * ⚠️ A bypassed build has NO valid token. Server sync (progress, XP, quests)
 * will fail — SRS is local-first so lessons and flashcards still work, but do
 * not read anything into a green run here about the sync path. Turn the flag
 * off before testing anything server-shaped.
 */
export const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

export const NATIVE_AUTH_BYPASS =
  IS_NATIVE && import.meta.env.VITE_NATIVE_AUTH_BYPASS === "true";

/** True when the app should behave as signed-in without an Auth0 session. */
export const AUTH_BYPASS = DEV_AUTH_BYPASS || NATIVE_AUTH_BYPASS;

/**
 * Whether this build can sync with the authed backend. A bypassed build holds
 * only `BYPASS_TOKEN`, which the server rejects (by design), so every authed
 * request can only 401. Firing them anyway is pure cost: on a cold Lambda the
 * boot wave stalls the first paint for ~10 s waiting on round-trips that were
 * never going to succeed. Consumers gate their server fetches on this so a
 * bypassed build runs fully local-first (SRS + progress are localStorage-backed)
 * and paints immediately. Build-time constant → the guarded branches are
 * dead-code-eliminated from a normal (real-Auth0) build.
 */
export const SERVER_SYNC_ENABLED = !AUTH_BYPASS;

/**
 * The identity a bypassed session runs as. Shaped like an Auth0 `user` claim
 * set so consumers need no special-casing.
 */
export const BYPASS_USER = {
  sub: "dev|user-1",
  email: "dev@openlingo.local",
  name: "Trevor",
  given_name: "Trevor",
  nickname: "Trevor",
  picture: "",
};

/**
 * Stand-in access token. The backend will reject it — that is the point: a
 * bypassed build must fail loudly at the API boundary rather than quietly
 * appear to sync.
 */
export const BYPASS_TOKEN = "dev-bypass";
