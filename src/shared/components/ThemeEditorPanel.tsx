import { useTranslation } from "react-i18next";
import { useTheme } from "@/shared/contexts/ThemeContext";
import {
  BUILT_IN_THEMES,
  MOCK_COMMUNITY_THEMES,
  FONT_PRESETS,
  getFontFamily,
  DEFAULT_FONT_ID,
  type ThemeTokens,
  type ThemeDefinition,
} from "@/shared/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/shared/components/Icon";

const COLOR_KEYS: (keyof ThemeTokens["colors"])[] = [
  "background",
  "surface",
  "surfaceMuted",
  "border",
  "textPrimary",
  "textSecondary",
  "accent",
  "accentHover",
  "error",
  "success",
  "warning",
  "info",
  "destructive",
  "link",
];

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 shrink-0 rounded border border-border"
        style={{ backgroundColor: value }}
      />
      <label className="min-w-0 flex-1 text-sm text-text-secondary">
        {label}
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
        aria-label={label}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary"
        spellCheck={false}
      />
    </div>
  );
}

export function ThemeEditorPanel() {
  const { t } = useTranslation();
  const {
    activeThemeId,
    activeTokens,
    customThemes,
    setTheme,
    addTheme,
    updateTheme,
    deleteTheme,
    installCommunityTheme,
    starCommunityTheme,
    unstarCommunityTheme,
    isStarred,
    closeThemeEditor,
  } = useTheme();

  const [draft, setDraft] = useState<ThemeTokens>(() => activeTokens);
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const isEditingCustom = editingId !== null && editingId.startsWith("custom-");

  useEffect(() => {
    if (editingId) {
      const def = BUILT_IN_THEMES[editingId] ?? customThemes.find((t) => t.id === editingId);
      if (def) {
        setDraft(def.tokens);
        setDraftName(def.name);
      }
    } else {
      setDraft(activeTokens);
      const def = BUILT_IN_THEMES[activeThemeId] ?? customThemes.find((t) => t.id === activeThemeId);
      setDraftName(def?.name ?? "");
    }
  }, [editingId, activeThemeId, activeTokens, customThemes]);

  const handlePresetClick = useCallback(
    (id: string) => {
      setTheme(id);
      setEditingId(null);
      setDraft(BUILT_IN_THEMES[id]?.tokens ?? activeTokens);
      setDraftName(BUILT_IN_THEMES[id]?.name ?? "");
      setIsCustomizing(false);
    },
    [setTheme, activeTokens]
  );

  const handleYourThemeClick = useCallback(
    (id: string) => {
      setTheme(id);
      setEditingId(null);
      const def = customThemes.find((t) => t.id === id);
      if (def) {
        setDraft(def.tokens);
        setDraftName(def.name);
      }
    },
    [setTheme, customThemes]
  );

  const handleEditTheme = useCallback((id: string) => {
    setEditingId(id);
    setIsCustomizing(true);
  }, []);

  const handleAddNew = useCallback(() => {
    const newTheme = addTheme({ name: t("settings.newTheme", "New theme"), tokens: { ...BUILT_IN_THEMES.dark.tokens } });
    setTheme(newTheme.id);
    setEditingId(newTheme.id);
    setDraft(newTheme.tokens);
    setDraftName(newTheme.name);
    setIsCustomizing(true);
  }, [addTheme, setTheme, t]);

  const handleSaveDraft = useCallback(() => {
    if (editingId && isEditingCustom) {
      updateTheme(editingId, { tokens: draft, name: draftName.trim() || "Unnamed" });
      setDraftName(draftName.trim() || "Unnamed");
    } else if (editingId) {
      const newTheme = addTheme({ name: draftName.trim() || "Custom", tokens: draft });
      setTheme(newTheme.id);
      setEditingId(newTheme.id);
    } else {
      const newTheme = addTheme({ name: draftName.trim() || "Custom", tokens: draft });
      setTheme(newTheme.id);
      setEditingId(newTheme.id);
    }
  }, [editingId, isEditingCustom, draft, draftName, addTheme, updateTheme, setTheme]);

  const handleDeleteTheme = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(t("settings.deleteThemeConfirm", "Delete this theme?"))) {
        deleteTheme(id);
        if (editingId === id) {
          setEditingId(null);
          setIsCustomizing(false);
          setTheme("dark");
        }
      }
    },
    [deleteTheme, editingId, setTheme, t]
  );

  const handleColorChange = useCallback((key: keyof ThemeTokens["colors"], value: string) => {
    setDraft((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const handleFontChange = useCallback((fontId: string) => {
    setDraft((prev) => ({
      ...prev,
      font: { family: getFontFamily(fontId) },
    }));
  }, []);

  const currentFontId = useMemo(() => {
    const family = draft.font?.family ?? getFontFamily(DEFAULT_FONT_ID);
    return FONT_PRESETS.find((f) => f.value === family)?.id ?? DEFAULT_FONT_ID;
  }, [draft.font?.family]);

  const handleInstallCommunity = useCallback(
    (theme: ThemeDefinition) => {
      const installed = installCommunityTheme(theme);
      setEditingId(installed.id);
      setDraft(installed.tokens);
      setDraftName(installed.name);
      setIsCustomizing(true);
    },
    [installCommunityTheme]
  );

  const presetIds = useMemo(() => Object.keys(BUILT_IN_THEMES), []);

  const previewVars = useMemo(() => {
    const vars: Record<string, string> = {};
    Object.entries(draft.colors).forEach(([key, value]) => {
      const varName = `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "")}`;
      vars[varName] = value;
    });
    Object.entries(draft.radius).forEach(([key, value]) => {
      vars[`--radius-${key}`] = `${value}px`;
    });
    return vars;
  }, [draft]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={closeThemeEditor}
        aria-hidden
      />
      <aside
        className="fixed right-4 top-4 bottom-14 z-50 flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.themeEditor", "Theme editor")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("settings.themeEditor", "Theme")}
          </h2>
          <button
            type="button"
            onClick={closeThemeEditor}
            className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
            aria-label={t("common.close", "Close")}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Live preview */}
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("settings.themePreview", "Preview")}
            </h3>
            <div
              className="theme-editor-preview rounded-lg p-4"
              style={{
                ...previewVars,
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
              }}
            >
              <style>{`
                .theme-editor-preview .preview-btn-primary:hover { background-color: var(--color-accent-hover) !important; }
                .theme-editor-preview .preview-btn-secondary:hover { background-color: var(--color-surface-muted) !important; }
              `}</style>
              <div
                className="mb-3 rounded-lg border p-3"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <p className="mb-2 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Card surface
                </p>
                <p className="mb-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Secondary text
                </p>
                <div
                  className="mb-3 rounded px-2 py-1.5 text-xs"
                  style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
                >
                  Surface muted
                </div>
                <div className="mb-3 flex flex-wrap gap-1">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--color-error)", color: "white" }}
                  >
                    Error
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--color-success)", color: "white" }}
                  >
                    Success
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--color-warning)", color: "white" }}
                  >
                    Warning
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="preview-btn-primary rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    Primary (hover)
                  </button>
                  <button
                    type="button"
                    className="preview-btn-secondary rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    Secondary (hover)
                  </button>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Colors update as you edit
              </p>
            </div>
          </section>

          {/* Presets */}
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("settings.themePresets", "Presets")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {presetIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePresetClick(id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    activeThemeId === id && !editingId
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface text-text-primary hover:bg-surface-muted"
                  }`}
                >
                  {BUILT_IN_THEMES[id]?.name ?? id}
                </button>
              ))}
            </div>
          </section>

          {/* Your Themes */}
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("settings.yourThemes", "Your themes")}
              </h3>
              <button
                type="button"
                onClick={handleAddNew}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent-muted"
              >
                <Icon name="plus" size={14} />
                {t("settings.addTheme", "Add")}
              </button>
            </div>
            {customThemes.length === 0 ? (
              <p className="text-xs text-text-muted">
                {t("settings.noCustomThemes", "No custom themes yet. Add one or install from community.")}
              </p>
            ) : (
              <div className="space-y-2">
                {customThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 ${
                      activeThemeId === theme.id && !editingId
                        ? "border-accent bg-accent-muted/50"
                        : "border-border hover:bg-surface-muted"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleYourThemeClick(theme.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <div
                        className="h-6 w-6 shrink-0 rounded border border-border"
                        style={{ backgroundColor: theme.tokens.colors.accent }}
                      />
                      <span className="truncate text-sm font-medium text-text-primary">
                        {theme.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTheme(theme.id)}
                      className="rounded p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                      aria-label={t("settings.editTheme", "Edit")}
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTheme(theme.id, e)}
                      className="rounded p-1.5 text-text-muted hover:bg-error/10 hover:text-error"
                      aria-label={t("settings.deleteTheme", "Delete")}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Community Themes */}
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("settings.communityThemes", "Community themes")}
            </h3>
            <div className="space-y-2">
              {MOCK_COMMUNITY_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <div
                    className="h-8 w-12 shrink-0 rounded border border-border"
                    style={{
                      background: `linear-gradient(135deg, ${theme.tokens.colors.background} 50%, ${theme.tokens.colors.accent} 50%)`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {theme.name}
                    </p>
                    {theme.author && (
                      <p className="text-xs text-text-muted">by {theme.author}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => (isStarred(theme.id) ? unstarCommunityTheme(theme.id) : starCommunityTheme(theme.id))}
                      className={`rounded p-1.5 ${
                        isStarred(theme.id)
                          ? "text-warning"
                          : "text-text-muted hover:text-warning"
                      }`}
                      aria-label={isStarred(theme.id) ? t("settings.unstarTheme", "Unstar") : t("settings.starTheme", "Star")}
                    >
                      <Icon name="star" size={16} fill={isStarred(theme.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInstallCommunity(theme)}
                      className="rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover"
                    >
                      {t("settings.installTheme", "Add")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customize colors */}
          <section>
            <button
              type="button"
              onClick={() => setIsCustomizing((c) => !c)}
              className="mb-2 text-sm font-medium text-accent hover:text-accent-hover"
            >
              {isCustomizing ? "− " : "+ "}
              {t("settings.customizeColors", "Customize colors")}
            </button>

            {isCustomizing && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-secondary">
                    {t("settings.themeName", "Name")}
                  </label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder={t("settings.themeNamePlaceholder", "Theme name")}
                    className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-secondary">
                    {t("settings.themeFont", "Font")}
                  </label>
                  <select
                    value={currentFontId}
                    onChange={(e) => handleFontChange(e.target.value)}
                    className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                {COLOR_KEYS.map((key) => (
                  <ColorRow
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    value={draft.colors[key]}
                    onChange={(v) => handleColorChange(key, v)}
                  />
                ))}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    {isEditingCustom ? t("settings.saveTheme", "Save") : t("settings.saveAsNew", "Save as new")}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}

