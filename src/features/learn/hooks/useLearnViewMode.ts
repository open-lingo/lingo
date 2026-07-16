import { useCallback, useState } from "react";

export type LearnViewMode = "map" | "list";

const key = (lang: string) => `lingo:learn-view:${lang}`;

function read(lang: string): LearnViewMode {
  try {
    const v = localStorage.getItem(key(lang));
    return v === "list" ? "list" : "map";
  } catch {
    return "map";
  }
}

/** Persisted Path⇄List preference for the learn homepage, per language. */
export function useLearnViewMode(lang: string) {
  const [mode, setMode] = useState<LearnViewMode>(() => read(lang));
  const set = useCallback(
    (m: LearnViewMode) => {
      setMode(m);
      try {
        localStorage.setItem(key(lang), m);
      } catch {
        /* private mode — session-only */
      }
    },
    [lang],
  );
  return [mode, set] as const;
}
