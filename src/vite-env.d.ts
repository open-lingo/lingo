/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  // "true" enables the E2E portable-auth path (localStorage cache + refresh
  // tokens) so a :5173 login can be replayed on any port. Off in prod/dev.
  readonly VITE_E2E?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
