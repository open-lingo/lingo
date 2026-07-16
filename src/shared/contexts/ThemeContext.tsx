import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BUILT_IN_THEMES,
  applyThemeToDOM,
  ensureThemeTokens,
  getFontIdFromFamily,
  loadFontFamily,
  type ThemeTokens,
  type ThemeDefinition,
} from "@/shared/theme";
import {
  loadStoredThemes,
  saveStoredThemes,
  loadStarredThemeIds,
  saveStarredThemeIds,
} from "@/shared/theme/storage";
import { resolveCardRadius } from "@/shared/theme/cornerStyle";
import { useSettings } from "@/shared/contexts/SettingsContext";

type ThemeId = string;

function resolveTokens(
  themeId: ThemeId,
  customThemes: ThemeDefinition[]
): ThemeTokens {
  const builtIn = BUILT_IN_THEMES[themeId];
  if (builtIn) return builtIn.tokens;
  const custom = customThemes.find((t) => t.id === themeId);
  const raw = custom?.tokens ?? BUILT_IN_THEMES.dark.tokens;
  return ensureThemeTokens(raw);
}

export type ThemeMode = "light" | "dark";

function getThemeMode(tokens: ThemeTokens): ThemeMode {
  const hex = tokens.colors.background.replace("#", "");
  const rgb = parseInt(hex, 16);
  if (isNaN(rgb)) return "dark";
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 128 ? "dark" : "light";
}

type ThemeContextValue = {
  activeThemeId: ThemeId;
  activeTokens: ThemeTokens;
  themeMode: ThemeMode;
  customThemes: ThemeDefinition[];
  starredCommunityIds: string[];
  setTheme: (id: ThemeId) => void;
  addTheme: (theme: Omit<ThemeDefinition, "id">) => ThemeDefinition;
  updateTheme: (id: ThemeId, patch: Partial<ThemeDefinition>) => void;
  deleteTheme: (id: ThemeId) => void;
  installCommunityTheme: (theme: ThemeDefinition) => ThemeDefinition;
  starCommunityTheme: (id: string) => void;
  unstarCommunityTheme: (id: string) => void;
  isStarred: (id: string) => boolean;
  getTheme: (id: ThemeId) => (ThemeDefinition & { tokens: ThemeTokens }) | null;
  openThemeEditor: () => void;
  closeThemeEditor: () => void;
  isThemeEditorOpen: boolean;
  /** Temporary app-wide preview (theme editor community themes). */
  previewTokens: ThemeTokens | null;
  setPreviewTokens: (tokens: ThemeTokens | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function generateCustomId(): string {
  return `custom-${crypto.randomUUID().slice(0, 8)}`;
}

const LIGHT_THEMES = ["light", "sepia"];
const DARK_THEMES = ["dark", "amoled"];

function usePrefersColorSchemeDark(): boolean {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

function resolveEffectiveTheme(
  themeId: ThemeId,
  systemPrefersDark: boolean,
  customThemes: ThemeDefinition[]
): { effectiveThemeId: ThemeId; themeMode: ThemeMode } {
  const useSystem = themeId === "auto" || themeId === "system";
  const paletteMode = useSystem
    ? systemPrefersDark
      ? "dark"
      : "light"
    : LIGHT_THEMES.includes(themeId)
      ? "light"
      : "dark";
  if (useSystem) {
    const fallback = paletteMode === "light" ? "light" : "dark";
    return { effectiveThemeId: fallback, themeMode: paletteMode };
  }

  const custom = customThemes.find((t) => t.id === themeId);
  // Installed / custom themes keep their own palette — do not swap to light/dark
  // presets when the user runs auto or a mismatched built-in (e.g. sepia-based
  // community themes were incorrectly replaced with plain dark).
  if (custom) {
    const tokens = ensureThemeTokens(custom.tokens);
    return { effectiveThemeId: themeId, themeMode: getThemeMode(tokens) };
  }

  const builtIn = BUILT_IN_THEMES[themeId];
  const currentMode = builtIn
    ? (builtIn as { mode?: ThemeMode }).mode ?? "dark"
    : "dark";
  const prefersLight = paletteMode === "light";
  const matches = prefersLight
    ? LIGHT_THEMES.includes(themeId) || currentMode === "light"
    : DARK_THEMES.includes(themeId) || currentMode === "dark";
  if (matches) {
    return { effectiveThemeId: themeId, themeMode: paletteMode };
  }
  const fallback = prefersLight ? "light" : "dark";
  return { effectiveThemeId: fallback, themeMode: paletteMode };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSetting } = useSettings();
  const systemPrefersDark = usePrefersColorSchemeDark();
  const activeThemeId = settings.appearance.themeId;
  const [data, setData] = useState<{ customThemes: ThemeDefinition[] }>(() => ({
    customThemes: [],
  }));
  const [starredCommunityIds, setStarredCommunityIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [previewTokens, setPreviewTokens] = useState<ThemeTokens | null>(null);

  useEffect(() => {
    const stored = loadStoredThemes();
    setData({ customThemes: stored.customThemes });
    setStarredCommunityIds(loadStarredThemeIds());
    setMounted(true);
  }, []);

  const persistCustomThemes = useCallback((customThemes: ThemeDefinition[]) => {
    setData((prev) => {
      const next = { ...prev, customThemes };
      saveStoredThemes({ customThemes });
      return next;
    });
  }, []);

  const { effectiveThemeId, themeMode } = useMemo(
    () =>
      resolveEffectiveTheme(
        activeThemeId,
        systemPrefersDark,
        data.customThemes
      ),
    [activeThemeId, systemPrefersDark, data.customThemes]
  );

  const activeTokens = useMemo(
    () => {
      const tokens = resolveTokens(effectiveThemeId, data.customThemes);
      // Override font when dyslexia-friendly font is enabled in accessibility settings.
      if (settings.accessibility?.dyslexiaFont) {
        return {
          ...tokens,
          font: { ...tokens.font, family: '"Atkinson Hyperlegible", ' + tokens.font.family },
        };
      }
      return tokens;
    },
    [effectiveThemeId, data.customThemes, settings.accessibility?.dyslexiaFont]
  );

  const domTokens = useMemo(() => {
    if (!previewTokens) return activeTokens;
    if (settings.accessibility?.dyslexiaFont) {
      return {
        ...previewTokens,
        font: {
          ...previewTokens.font,
          family:
            '"Atkinson Hyperlegible", ' + previewTokens.font.family,
        },
      };
    }
    return previewTokens;
  }, [activeTokens, previewTokens, settings.accessibility?.dyslexiaFont]);

  const domThemeMode = previewTokens
    ? getThemeMode(previewTokens)
    : themeMode;

  useEffect(() => {
    if (!mounted) return;
    // Kick off the Google Font fetch for whichever font this theme uses.
    // No-op for system / georgia / already-loaded fonts. We don't await —
    // CSS font-display:swap shows the fallback until the file lands, then
    // swaps in the chosen face. This keeps theme application synchronous
    // for color/radius changes (which are the common case).
    void loadFontFamily(getFontIdFromFamily(domTokens.font?.family));
    // Ensure Atkinson Hyperlegible is loaded when the dyslexia-friendly
    // font toggle is active (the getFontIdFromFamily lookup won't resolve
    // it when the family string has been prepended to a base theme font).
    if (settings.accessibility?.dyslexiaFont) {
      void loadFontFamily("atkinson");
    }
    applyThemeToDOM(domTokens);
    const root = document.documentElement;
    const scale = settings.accessibility?.fontSize ?? 1;
    // Multiply the user's font-size scale onto the fluid viewport base
    // (--font-base, index.css) instead of a fixed 16px, so a chosen 125%
    // stays 125% of whatever the viewport-scaled base is.
    root.style.fontSize =
      scale === 1 ? "" : `calc(var(--font-base, 1rem) * ${scale})`;
    // Card/modal corner rounding is theme-scoped: the active theme's own
    // `radius.card` drives it, falling back to the shared default. Users change
    // corners by duping a theme and editing it (Theme Editor → Corners).
    root.style.setProperty(
      "--radius-card",
      resolveCardRadius(domTokens.radius.card),
    );
    // Ensure light/dark class is set correctly — remove both and add current mode
    const existing = root.getAttribute("class") ?? "";
    const without = existing.replace(/\b(light|dark)\b/g, "").trim();
    root.setAttribute(
      "class",
      without ? `${without} ${domThemeMode}` : domThemeMode,
    );
  }, [
    domTokens,
    domThemeMode,
    mounted,
    settings.accessibility?.fontSize,
  ]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      updateSetting("appearance.themeId", id);
    },
    [updateSetting]
  );

  const addTheme = useCallback(
    (theme: Omit<ThemeDefinition, "id">): ThemeDefinition => {
      const full: ThemeDefinition = { ...theme, id: generateCustomId() };
      const nextThemes = [...data.customThemes, full];
      persistCustomThemes(nextThemes);
      updateSetting("appearance.themeId", full.id);
      return full;
    },
    [data.customThemes, persistCustomThemes, updateSetting]
  );

  const updateTheme = useCallback(
    (id: ThemeId, patch: Partial<ThemeDefinition>) => {
      const next = data.customThemes.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      );
      persistCustomThemes(next);
    },
    [data.customThemes, persistCustomThemes]
  );

  const deleteTheme = useCallback(
    (id: ThemeId) => {
      const nextThemes = data.customThemes.filter((t) => t.id !== id);
      const nextId = activeThemeId === id ? "dark" : activeThemeId;
      persistCustomThemes(nextThemes);
      if (activeThemeId === id) {
        updateSetting("appearance.themeId", nextId);
      }
    },
    [activeThemeId, data.customThemes, persistCustomThemes, updateSetting]
  );

  const installCommunityTheme = useCallback(
    (theme: ThemeDefinition): ThemeDefinition => {
      const installed: ThemeDefinition = { ...theme, id: generateCustomId() };
      const nextThemes = [...data.customThemes, installed];
      persistCustomThemes(nextThemes);
      updateSetting("appearance.themeId", installed.id);
      return installed;
    },
    [data.customThemes, persistCustomThemes, updateSetting]
  );

  const starCommunityTheme = useCallback((id: string) => {
    setStarredCommunityIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveStarredThemeIds(next);
      return next;
    });
  }, []);

  const unstarCommunityTheme = useCallback((id: string) => {
    setStarredCommunityIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveStarredThemeIds(next);
      return next;
    });
  }, []);

  const isStarred = useCallback(
    (id: string) => starredCommunityIds.includes(id),
    [starredCommunityIds]
  );

  const getTheme = useCallback(
    (id: ThemeId) => {
      const builtIn = BUILT_IN_THEMES[id];
      if (builtIn) return builtIn as ThemeDefinition & { tokens: ThemeTokens };
      const custom = data.customThemes.find((t) => t.id === id);
      return custom ?? null;
    },
    [data.customThemes]
  );

  const openThemeEditor = useCallback(() => setIsThemeEditorOpen(true), []);
  const closeThemeEditor = useCallback(() => {
    setPreviewTokens(null);
    setIsThemeEditorOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      activeThemeId,
      activeTokens,
      themeMode,
      customThemes: data.customThemes,
      starredCommunityIds,
      setTheme,
      addTheme,
      updateTheme,
      deleteTheme,
      installCommunityTheme,
      starCommunityTheme,
      unstarCommunityTheme,
      isStarred,
      getTheme,
      openThemeEditor,
      closeThemeEditor,
      isThemeEditorOpen,
      previewTokens,
      setPreviewTokens,
    }),
    [
      activeThemeId,
      data.customThemes,
      activeTokens,
      themeMode,
      starredCommunityIds,
      setTheme,
      addTheme,
      updateTheme,
      deleteTheme,
      installCommunityTheme,
      starCommunityTheme,
      unstarCommunityTheme,
      isStarred,
      getTheme,
      openThemeEditor,
      closeThemeEditor,
      isThemeEditorOpen,
      previewTokens,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
