import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import "@/shared/i18n/i18n";
import { requireAuth0Config, auth0Audience } from "@/shared/auth/config";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import { LanguageProvider } from "@/shared/contexts/LanguageContext";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import { ApiProvider } from "@/shared/api/provider";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();
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
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ApiProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>
);