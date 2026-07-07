import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Portal } from "@/shared/components/ui/Portal";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useCommands } from "./useCommands";
import { filterCommands } from "./filter";
import type { Command } from "./types";

/** Max content matches (lessons + vocab) shown for a query — keeps the DOM light. */
const MAX_RESULTS = 40;

/**
 * Global command palette. Open with ⌘K / Ctrl+K. Surfaces navigation, every
 * settings section (deep-linked), and — once you type — lessons and vocab.
 * Mount once inside the authenticated shell.
 */
export function CommandPalette() {
  const { t } = useTranslation();
  const commands = useCommands();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // ⌘K / Ctrl+K toggles from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on route change (a command navigated us somewhere).
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Focus the input when opened.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(
    () => filterCommands(commands, query).slice(0, query.trim() ? MAX_RESULTS : commands.length),
    [commands, query],
  );

  // Group while preserving the flat order so keyboard index maps cleanly.
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of results) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return [...map.entries()];
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runActive = useCallback(() => {
    const cmd = results[activeIndex];
    if (cmd) {
      cmd.perform();
      close();
    }
  }, [results, activeIndex, close]);

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  };

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[60] flex items-start justify-center bg-overlay/80 px-4 pt-[12vh]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("cmd.title", "Command palette")}
          className="w-full max-w-xl overflow-hidden rounded-card border border-border bg-surface shadow-popover animate-fade-up"
        >
          {/* Search row */}
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Icon name="search" size={18} className="shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={t("cmd.placeholder", "Search pages, settings, lessons, words…")}
              className="w-full bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              aria-label={t("cmd.placeholder", "Search pages, settings, lessons, words…")}
            />
            <kbd className="hidden shrink-0 rounded border border-border-muted px-1.5 py-0.5 text-[10px] text-text-muted sm:inline">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-muted">
                {t("cmd.empty", "No matches")}
              </p>
            ) : (
              groups.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {group}
                  </p>
                  {items.map((cmd) => {
                    flatIndex += 1;
                    const idx = flatIndex;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-cmd-index={idx}
                        onMouseMove={() => setActiveIndex(idx)}
                        onClick={() => {
                          cmd.perform();
                          close();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left text-sm",
                          isActive ? "bg-accent-muted text-text-primary" : "text-text-secondary",
                        )}
                      >
                        {cmd.icon && (
                          <Icon
                            name={cmd.icon}
                            size={16}
                            className={isActive ? "text-accent" : "text-text-muted"}
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-text-primary">{cmd.label}</span>
                        {cmd.hint && (
                          <span className="shrink-0 truncate text-xs text-text-muted">{cmd.hint}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-text-muted">
            <span>{t("cmd.footerNav", "↑↓ navigate · ↵ select")}</span>
            <span>{t("cmd.footerHint", "⌘K to toggle")}</span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
