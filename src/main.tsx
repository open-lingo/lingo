import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import "@/shared/i18n/i18n";
import { requireAuth0Config, auth0Audience } from "@/shared/auth/config";
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
import "overlayscrollbars/overlayscrollbars.css";
import "./index.css";

installDevLog();
// Boot-time read so `?tester=1` is captured on landing and persists
// through signup / route changes before the URL param is dropped.
isTesterMode();

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
const { domain, clientId } = requireAuth0Config();

// Use a single canonical origin (with trailing slash) so Auth0 callback URL matches exactly
const redirectUri =
  window.location.origin + (window.location.origin.endsWith("/") ? "" : "/");

// E2E-ONLY portable auth. Default (prod + normal dev) keeps the Auth0 in-memory
// cache: the session only re-hydrates via silent-auth on an Auth0-allowlisted
// origin (:5173), so it is NOT portable to other ports. When VITE_E2E=true we
// switch to the localStorage cache + refresh tokens instead. A one-time login on
// :5173 then produces a localStorage-cached token + refresh token that
// Playwright's storageState can capture and replay on ANY origin/port — which is
// what lets the mobile matrix run authed off a non-5173 worktree port. These
// props are applied conditionally so the non-e2e path is byte-for-byte today's
// memory-cache behavior.
const e2eAuth = import.meta.env.VITE_E2E === "true";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      {...(e2eAuth
        ? {
            cacheLocation: "localstorage" as const,
            useRefreshTokens: true,
            useRefreshTokensFallback: true,
          }
        : {})}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(auth0Audience ? { audience: auth0Audience } : {}),
      }}
    >
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