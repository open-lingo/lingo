/**
 * Formatters + small helpers for the public-profile surface. Extracted from
 * PublicProfilePage so the page file stays composition-focused and these are
 * unit-testable in isolation.
 */
import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/client";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

export function formatJoinDate(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
}

/**
 * Format a last-active timestamp. Recent activity collapses to relative
 * ("active 2h ago"), older falls back to absolute ("last seen May 25").
 * Every branch is routed through ``t()`` so the copy localizes.
 */
export function formatLastActive(
  iso: string | null | undefined,
  locale: string,
  t: TFunction,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const deltaMs = Date.now() - d.getTime();
  if (deltaMs < 0) {
    return t("profile.publicLastActiveNow", "active now");
  }
  const mins = Math.floor(deltaMs / 60_000);
  if (mins < 1) return t("profile.publicLastActiveNow", "active now");
  // The defaultValue bakes the number in (rather than a ``{{var}}``
  // placeholder) so it reads correctly even when i18next hasn't been
  // initialized and returns the raw defaultValue. The named var is still
  // passed so the localized en/ko/es resource (with ``{{mins}}`` etc.)
  // interpolates when i18next IS initialized.
  if (mins < 60) {
    return t("profile.publicLastActiveMinutes", {
      defaultValue: `active ${mins}m ago`,
      mins,
    });
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t("profile.publicLastActiveHours", {
      defaultValue: `active ${hours}h ago`,
      hours,
    });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t("profile.publicLastActiveDays", {
      defaultValue: `active ${days}d ago`,
      days,
    });
  }
  const date = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  return t("profile.publicLastActiveSeen", {
    defaultValue: `last seen ${date}`,
    date,
  });
}

/**
 * Approximate XP curve for the "XP to next level" display. Mirrors the
 * back-end progression at a glance; exact values aren't load-bearing here
 * since the backend authoritatively assigns levels.
 */
export function xpToNextLevel(level: number, xp: number): number {
  const nextThreshold = (level + 1) * 100 * (1 + (level - 1) * 0.15);
  const remaining = Math.max(0, Math.ceil(nextThreshold - xp));
  return remaining;
}

/**
 * Progress through the current level as a 0..1 fraction. Used by the
 * hairline progress bar under the level chip; same approximation as
 * xpToNextLevel above (backend is authoritative for the level number).
 */
export function levelProgress(level: number, xp: number): number {
  const prev = level * 100 * (1 + Math.max(0, level - 2) * 0.15);
  const next = (level + 1) * 100 * (1 + (level - 1) * 0.15);
  const span = Math.max(1, next - prev);
  return Math.min(1, Math.max(0, (xp - prev) / span));
}

export function formatLearningLanguage(
  code: string | null | undefined,
): { label: string; flag: string | null } | null {
  if (!code) return null;
  const cfg = getLanguageConfig(code);
  if (cfg) return { label: cfg.name, flag: cfg.flag };
  return { label: code.toUpperCase(), flag: null };
}

/**
 * Pull a human-readable ``detail`` string out of an ApiError body, falling
 * back to the supplied copy for non-ApiError / detail-less failures. Shared
 * by the relationship-action hook and the avatar-URL modal so the extraction
 * lives in exactly one place.
 */
export function apiErrorDetail(err: unknown, fallback: string): string {
  if (
    err instanceof ApiError &&
    typeof err.body === "object" &&
    err.body &&
    "detail" in err.body
  ) {
    return String((err.body as { detail?: unknown }).detail);
  }
  return fallback;
}
