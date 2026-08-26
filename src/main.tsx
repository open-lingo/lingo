import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Deploys purge old hashed chunks from S3 (`aws s3 sync --delete`), so a tab
// whose HTML predates the deploy throws "Failed to fetch dynamically imported
// module" on its next lazy navigation. Vite fires `vite:preloadError` for
// exactly this; one reload picks up the new index.html. The sessionStorage
// guard stops a reload loop when a chunk is missing for some other reason —
// cleared on success so the NEXT deploy gets its reload too.
window.addEventListener("vite:preloadError", (event) => {
  const RELOADED_KEY = "chunk-reload-at";
  const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0);
  if (Date.now() - last < 30_000) return; // just reloaded and still failing
  sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
  event.preventDefault(); // suppress the unhandled rejection; we're handling it
  window.location.reload();
});
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import "@/shared/i18n/i18n";
import {
  requireAuth0Config,
  auth0Audience,
  auth0Domain,
  auth0ClientId,
} from "@/shared/auth/config";
import { AUTH_BYPASS } from "@/shared/auth/bypass";
import { SettingsProvider } from "@/shared/contexts/SettingsContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import { LanguageProvider } from "@/shared/contexts/LanguageContext";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import { ApiProvider } from "@/shared/api/provider";
import { ImpersonationProvider } from "@/features/admin/impersonation/ImpersonationContext";
import { FeatureFlagsProvider } from "@/shared/contexts/FeatureFlagsContext";
import { SRSStoreRevisionProvider } from "@/features/flashcards/SRSStoreRevisionContext";
import { AdProviderRoot } from "@/features/ads";
import { BodyScrollbars } from "@/shared/components/BodyScrollbars";
import App from "./App";
import { installDevLog } from "@/shared/devlog/devLog";
import { isTesterMode } from "@/shared/telemetry/sessionLog";
import { IS_NATIVE, nativeCallbackUrl } from "@/shared/platform/native";
import { NativeAuthBridge } from "@/shared/platform/NativeAuthBridge";
import { AuthBypassBadge } from "@/shared/auth/AuthBypassBadge";
import { warmLearnerPathOnIdle } from "@/shared/utils/routePrefetch";
import "overlayscrollbars/overlayscrollbars.css";
import "./index.css";

installDevLog();
// Boot-time read so `?tester=1` is captured on landing and persists
// through signup / route changes before the URL param is dropped.
isTesterMode();

// Service worker: web prod builds only. Registration is `immediate` so the
// precache fills on the visit that installs it, not the one after. Skipped
// on native — WKWebView serves the app from the capacitor:// scheme where a
// SW buys nothing and Workbox's registration path is untested.
if (!IS_NATIVE && !import.meta.env.DEV && "serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) =>
    registerSW({ immediate: true }),
  );
}

// Warm the learner-path route chunks while Auth0 resolves the session —
// see warmLearnerPathOnIdle for the waterfall this removes. Dev servers
// skip it: it would just fan out module requests and muddy the network tab.
if (!import.meta.env.DEV) {
  warmLearnerPathOnIdle();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min – avoid refetching on every mount/tab switch
      gcTime: 5 * 60 * 1000, // 5 min
      retry: 1, // fewer retries to reduce load-cancel-load cycles
      refetchOnWindowFocus: false, // avoid refetch when switching tabs
    },
  },
});
// ⚠️ `requireAuth0Config()` THROWS on missing config, at module scope, before
// anything renders — so on a bypassed build (which by definition has no Auth0
// application yet) it white-screens the app before the bypass can take effect.
// Placeholders keep the provider constructible; nothing reads a token from it
// because `useAuth` and `ApiProvider` both short-circuit on `AUTH_BYPASS`.
// Auth0's background `checkSession` will fail against these and be swallowed.
const { domain, clientId } = AUTH_BYPASS
  ? {
      domain: auth0Domain || "bypass.invalid.auth0.com",
      clientId: auth0ClientId || "bypass",
    }
  : requireAuth0Config();

// Use a single canonical origin (with trailing slash) so Auth0 callback URL matches exactly.
// Native has no usable origin — `capacitor://localhost` is not somewhere iOS can hand a
// browser result back to — so it redirects through the app's custom URL scheme instead
// (`NativeAuthBridge` catches the deep link). Dead code in the web build.
const redirectUri = IS_NATIVE
  ? nativeCallbackUrl(domain)
  : window.location.origin + (window.location.origin.endsWith("/") ? "" : "/");

// Web auth persistence (2026-08-15): localStorage cache + refresh tokens,
// with silent-auth as the fallback. The in-memory cache forced a full
// silent-auth round trip (iframe to the Auth0 origin) on EVERY cold page
// load before RequireAuth would render anything — 0.5–1.5s of the boot
// waterfall for logged-in users, plus a hard availability dependency on
// Auth0 for users who were already signed in. With refresh tokens the
// session re-hydrates from localStorage instantly; `useRefreshTokensFallback:
// true` keeps existing memory-cache sessions working the first time they
// come back (no forced re-login on rollout) and covers a missing/expired
// refresh token the same way today's build covers everything.
// XSS tradeoff, quantified: the CSP is `script-src 'self'` with no inline
// script, tokens are audience-scoped to the lingo API, and Auth0 rotates
// refresh tokens on use — an exfiltrated token dies on its next rotation.
// This is the exact configuration the native build has shipped since the
// iOS wrapper (see nativeAuthProps) and E2E has replayed for months.
//
// This also collapses the old VITE_E2E branch: the E2E portable-auth
// configuration (localStorage session a :5173 login produces and
// Playwright's storageState replays on any origin/port) is now simply the
// web configuration.

// Native needs the same escape from the in-memory cache, for a different
// reason: Auth0's silent-auth iframe re-hydrates a session from a
// third-party cookie on the Auth0 domain, and WKWebView's ITP blocks that
// outright. Without refresh tokens in localStorage the user is logged out
// every single cold launch. `useRefreshTokensFallback: false` is deliberate —
// the fallback IS silent auth, so allowing it just re-enters the path that
// cannot work here and slows every failure down by an iframe timeout.
const nativeAuthProps = {
  cacheLocation: "localstorage" as const,
  useRefreshTokens: true,
  useRefreshTokensFallback: false,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      {...(IS_NATIVE
        ? nativeAuthProps
        : {
            cacheLocation: "localstorage" as const,
            useRefreshTokens: true,
            useRefreshTokensFallback: true,
          })}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(auth0Audience ? { audience: auth0Audience } : {}),
      }}
    >
      {IS_NATIVE && <NativeAuthBridge />}
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <ImpersonationProvider>
          <FeatureFlagsProvider>
          <SRSStoreRevisionProvider>
          <SettingsProvider>
            <ThemeProvider>
              <LanguageProvider>
              <ToastProvider>
                <ModalProvider>
                  <AdProviderRoot>
                    <BodyScrollbars />
                    <App />
                    <AuthBypassBadge />
                  </AdProviderRoot>
                </ModalProvider>
              </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SettingsProvider>
          </SRSStoreRevisionProvider>
          </FeatureFlagsProvider>
          </ImpersonationProvider>
        </ApiProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>
);