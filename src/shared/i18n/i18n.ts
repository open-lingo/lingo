import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ko from "./locales/ko.json";
import es from "./locales/es.json";

export const defaultNS = "translation" as const;
export const supportedLngs = ["en", "ko", "es"] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { [defaultNS]: en },
      ko: { [defaultNS]: ko },
      es: { [defaultNS]: es },
    },
    fallbackLng: "en",
    supportedLngs: [...supportedLngs],
    defaultNS,
    ns: [defaultNS],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
