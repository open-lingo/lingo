import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

import en from "./locales/en.json";

export const defaultNS = "translation" as const;
export const supportedLngs = ["en", "ko", "es"] as const;

// Only `en` ships as a static import — it's `fallbackLng`, so it MUST be
// synchronously available before first paint no matter which UI language
// ends up active. `ko`/`es` are ~38-42 KB gzip each and were previously
// bundled into the eager entry chunk for every user regardless of which
// (if either) they actually use — 119 KB gzip total, ~77 KB gzip avoidable
// per user (measured docs/perf-2026-09-17.md §2). Loading them through this
// backend instead puts them in their own lazy chunk, fetched only for a
// learner who has picked that UI language.
i18n
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language: string) => {
      switch (language) {
        case "ko":
          return import("./locales/ko.json");
        case "es":
          return import("./locales/es.json");
        default:
          // `en` is already bundled via `resources` below; nothing else is
          // supported (`supportedLngs` below is the real gate). An empty
          // object here is inert — i18next never reaches it for `en`.
          return Promise.resolve({});
      }
    })
  )
  .use(initReactI18next)
  .init({
    resources: {
      en: { [defaultNS]: en },
    },
    // Lets i18next use the backend above for languages/namespaces NOT
    // already present in `resources` (ko/es), while still treating `en`
    // as fully loaded from the bundle — without this flag, passing
    // `resources` at all disables the backend entirely.
    partialBundledLanguages: true,
    fallbackLng: "en",
    supportedLngs: [...supportedLngs],
    defaultNS,
    ns: [defaultNS],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // `querystring` added ahead of the existing two sources (2026-09-17,
      // lane A9): a deep-linkable `?lng=ko`/`?lng=es` override, same
      // standard i18next-browser-languagedetector option every other
      // source already used here. Doesn't change existing behavior for any
      // URL without that param — `localStorage` (the real switch, written
      // by `changeLanguage` in SettingsContext.tsx) then `navigator` still
      // decide everything else. Added so the lazy-locale-backend path
      // above (`ko`/`es` now loaded via dynamic `import()` instead of
      // bundled) could be verified on the 15 Pro Max simulator without a
      // scripted native `<select>` interaction — WKWebView defers that
      // control entirely to the OS picker sheet, which nothing here can
      // drive — and is otherwise a reasonable, low-risk support/QA
      // deep-link.
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    react: {
      // No <Suspense> boundary wraps the app (main.tsx renders straight to
      // the root). With a lazy backend, react-i18next's default
      // (useSuspense: true) would throw a promise from `useTranslation()`
      // for any component reading ko/es strings before that locale's
      // chunk resolves, and nothing above it catches a thrown promise —
      // it would surface as a blank screen via AppErrorBoundary instead of
      // a graceful wait. `false` makes those reads render the
      // already-loaded fallback (`en`) for the one frame the import takes,
      // then react-i18next's existing "loaded" listener (the same one
      // `changeLanguage` already relies on in SettingsContext.tsx) fires a
      // normal re-render once the chunk lands. No Suspense boundary or
      // main.tsx change needed.
      useSuspense: false,
    },
  });

export default i18n;
