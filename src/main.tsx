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
import { FeatureFlagsProvider } from "@/shared/contexts/FeatureFlagsContext";
import { SRSStoreRevisionProvider } from "@/features/flashcards/SRSStoreRevisionContext";
import { AdProviderRoot } from "@/features/ads";
import App from "./App";
import { installDevLog } from "@/shared/devlog/devLog";
import { isTesterMode } from "@/shared/telemetry/sessionLog";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(auth0Audience ? { audience: auth0Audience } : {}),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <FeatureFlagsProvider>
          <SRSStoreRevisionProvider>
          <SettingsProvider>
            <ThemeProvider>
              <LanguageProvider>
              <ToastProvider>
                <ModalProvider>
                  <AdProviderRoot>
                    <App />
                  </AdProviderRoot>
                </ModalProvider>
              </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SettingsProvider>
          </SRSStoreRevisionProvider>
          </FeatureFlagsProvider>
        </ApiProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>
);