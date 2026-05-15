import { useMemo } from "react";
import { useSettings } from "@/shared/contexts/SettingsContext";

/**
 * Centralized date formatting. Server dates are UTC/ISO 8601; we convert to
 * local time for display. Use settings.learning.uiLocale or settings.display.dateLocale
 * for locale override.
 */

export type DateFormatOptions = {
  dateStyle?: "short" | "medium" | "long" | "full";
  timeStyle?: "short" | "medium" | "long" | "full";
  locale?: string;
  timeZone?: string;
};

/**
 * Format an ISO 8601 date string for display.
 */
export function formatDate(iso: string, options?: DateFormatOptions): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(options?.locale, {
      dateStyle: options?.dateStyle ?? "medium",
      timeStyle: options?.timeStyle ?? "short",
      timeZone: options?.timeZone,
    }).format(date);
  } catch {
    return iso;
  }
}

/**
 * Format an ISO 8601 date string as date only (no time).
 */
export function formatDateOnly(iso: string, options?: DateFormatOptions): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(options?.locale, {
      dateStyle: options?.dateStyle ?? "medium",
      timeZone: options?.timeZone,
    }).format(date);
  } catch {
    return iso;
  }
}

/**
 * Relative time for display (e.g. "just now", "5m ago", "2h ago", "3d ago").
 * For older dates, consider using formatDateOnly instead or in addition.
 */
export function formatTimeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 43200 * 60) return `${Math.floor(sec / 86400)}d ago`;
  return formatDateOnly(iso);
}

/** Hook that returns formatDate/formatDateOnly with locale from settings. */
export function useDateFormat() {
  const { settings } = useSettings();
  const locale = settings.display?.dateLocale ?? settings.learning.uiLocale;
  const timeZone = settings.display?.timezoneOverride;
  const options = useMemo(
    () => ({ locale: locale || undefined, timeZone: timeZone || undefined }),
    [locale, timeZone]
  );
  return {
    formatDate: (iso: string, opts?: DateFormatOptions) =>
      formatDate(iso, { ...options, ...opts }),
    formatDateOnly: (iso: string, opts?: DateFormatOptions) =>
      formatDateOnly(iso, { ...options, ...opts }),
  };
}
