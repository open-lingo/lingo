import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import "@/i18n";
import { requireAuth0Config } from "@/auth/config";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
      authorizationParams={{ redirect_uri: redirectUri }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>
);