import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { preloadTtsManifests } from "@/shared/tts/manifest";
import { resetBootCache } from "@/shared/api/bootCache";

// The TTS manifests are lazy chunks in the app (see shared/tts/manifest.ts).
// Tests call `resolveTtsPath`/`getTtsUrl` synchronously and assert on audio
// coverage, so settle every manifest before any test file is imported —
// setup files finish before test modules load, which makes this one await
// the single seam that keeps ~30 audio-asserting test files synchronous.
await preloadTtsManifests();

// Reset @testing-library/react's mounted containers between tests so
// `screen.getByRole` and friends don't trip over portals or repeated
// mounts from prior tests (10 UI component tests were failing on this
// before — Switch/Pagination/Modal/Sheet/Dialog/Accordion/SegmentedControl).
afterEach(() => {
  cleanup();
  // Boot batching keeps module-level one-shot state (one /boot per acting
  // user per page load) — reset it so each test gets a fresh page-load.
  resetBootCache();
});
