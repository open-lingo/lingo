/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  // "true" enables the E2E portable-auth path (localStorage cache + refresh
  // tokens) so a :5173 login can be replayed on any port. Off in prod/dev.
  readonly VITE_E2E?: string;
  /** Origin of the marketing site (landing/roadmap/docs/legal). */
  readonly VITE_MARKETING_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by `define` in vite.config.ts — GITHUB_SHA in CI, a
// `local-<timestamp>` fallback for local builds/dev. Used by
// `lazyRetry.ts` to key the one-reload-per-build guard (prod #86).
declare const __LINGO_BUILD_ID__: string;

// Resolved by the `lesson-registry-bootstrap` plugin in vite.config.ts: the
// eager curriculum table under vitest / CONTENT_EMIT, an empty module in
// every real build. See src/features/lesson/data/lessonRegistry.ts.
declare module "virtual:lesson-registry-bootstrap";
declare module "virtual:eager:*";
