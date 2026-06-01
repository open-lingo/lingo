/**
 * PlatformXpRatesPanel — embedded XP economy editor for the LMS page.
 *
 * Moved from AdminXpConfigPage (formerly the "XP config" tab on /admin/ops)
 * into the LMS surface, alongside the per-user student-file flow. LMS is
 * the home for "tune learning state", which covers both per-user moderation
 * and platform-wide XP rate tuning.
 *
 * Backed by GET/PUT /api/core/v1/admin/platform-settings/xp. Each input is
 * a number; defaults come from the schema (10 / 15 / 2 / …) and are filled
 * in by the server when the key hasn't been seeded yet. Save is a single
 * PUT — full-blob replace — so the form sends every key even when only one
 * changed. Optimistic update on the cache, rollback on error.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { XpEconomyConfig } from "@/shared/api/admin";
import { useToast } from "@/shared/contexts/ToastContext";
import { AlertBanner } from "@/shared/components/ui/AlertBanner";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";

const XP_QUERY_KEY = ["admin", "platform-settings", "xp"] as const;

// Field metadata drives the form so adding a new tunable is a one-line
// extension to FIELDS instead of a JSX copy/paste.
type FieldDef = {
  name: keyof XpEconomyConfig;
  labelKey: string;
  labelFallback: string;
  helpKey: string;
  helpFallback: string;
  min: number;
  max: number;
};

const FIELDS: FieldDef[] = [
  {
    name: "lesson_pass_xp",
    labelKey: "admin.xpConfig.lessonPassXp",
    labelFallback: "XP per lesson pass",
    helpKey: "admin.xpConfig.lessonPassXpHelp",
    helpFallback: "Awarded when a lesson is completed.",
    min: 0,
    max: 10_000,
  },
  {
    name: "lesson_perfect_xp",
    labelKey: "admin.xpConfig.lessonPerfectXp",
    labelFallback: "XP for a perfect lesson",
    helpKey: "admin.xpConfig.lessonPerfectXpHelp",
    helpFallback: "Total XP for a perfect-score pass (replaces the base value).",
    min: 0,
    max: 10_000,
  },
  {
    name: "review_xp",
    labelKey: "admin.xpConfig.reviewXp",
    labelFallback: "XP per SRS review",
    helpKey: "admin.xpConfig.reviewXpHelp",
    helpFallback: "Per individual card review (review-time XP not yet wired).",
    min: 0,
    max: 10_000,
  },
  {
    name: "streak_milestone_xp",
    labelKey: "admin.xpConfig.streakMilestoneXp",
    labelFallback: "Streak milestone bonus",
    helpKey: "admin.xpConfig.streakMilestoneXpHelp",
    helpFallback: "Awarded every 7 consecutive days.",
    min: 0,
    max: 100_000,
  },
  {
    name: "deck_approved_xp",
    labelKey: "admin.xpConfig.deckApprovedXp",
    labelFallback: "XP when a user's deck is approved",
    helpKey: "admin.xpConfig.deckApprovedXpHelp",
    helpFallback: "Authoring reward for community publication.",
    min: 0,
    max: 100_000,
  },
  {
    name: "first_module_finish_xp",
    labelKey: "admin.xpConfig.firstModuleFinishXp",
    labelFallback: "XP for first module clear",
    helpKey: "admin.xpConfig.firstModuleFinishXpHelp",
    helpFallback: "Awarded the first time a user finishes every lesson in a module.",
    min: 0,
    max: 100_000,
  },
  {
    name: "lingots_per_lesson",
    labelKey: "admin.xpConfig.lingotsPerLesson",
    labelFallback: "Lingots per lesson pass",
    helpKey: "admin.xpConfig.lingotsPerLessonHelp",
    helpFallback: "In-app currency awarded alongside XP.",
    min: 0,
    max: 10_000,
  },
];

export interface PlatformXpRatesPanelProps {
  /** When true, omit the panel's own title/subtitle header — the caller
   *  is providing context (e.g. a collapsible card with its own label). */
  hideHeader?: boolean;
}

export function PlatformXpRatesPanel({ hideHeader = false }: PlatformXpRatesPanelProps = {}) {
  const { t } = useTranslation();
  const { admin } = useApi();
  const queryClient = useQueryClient();
  const showToast = useToast().showToast;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: XP_QUERY_KEY,
    queryFn: () => admin.getXpConfig(),
    // Config changes infrequently; keep the cached value warm for 5 min.
    staleTime: 5 * 60_000,
  });

  // Local edit state, mirroring the loaded blob. Set on first load and
  // whenever the server returns a fresh copy.
  const [draft, setDraft] = useState<XpEconomyConfig | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setDraft(data);
      setDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: XpEconomyConfig) => admin.putXpConfig(payload),
    onSuccess: (next) => {
      queryClient.setQueryData(XP_QUERY_KEY, next);
      setDraft(next);
      setDirty(false);
      showToast(t("admin.xpConfig.saved", "XP config saved"), "success");
    },
    onError: () => {
      showToast(
        t("admin.xpConfig.saveError", "Could not save XP config"),
        "error",
      );
    },
  });

  const updateField = (name: keyof XpEconomyConfig, raw: string) => {
    if (!draft) return;
    // Parse defensively: blank → 0, NaN → keep prior. Negative values are
    // clamped to 0 server-side, but we also clamp here for snappier UI.
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) return;
    setDraft({ ...draft, [name]: Math.max(0, Math.floor(parsed)) });
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft || saveMutation.isPending) return;
    saveMutation.mutate(draft);
  };

  const handleReset = () => {
    if (!data) return;
    setDraft(data);
    setDirty(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {!hideHeader && (
        <header className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("admin.xpConfig.title", "Platform XP rates")}
          </h2>
          <p className="text-sm text-text-muted">
            {t(
              "admin.xpConfig.subtitle",
              "Tune how much XP and how many lingots learners earn. Changes apply to the next lesson sync — no redeploy needed.",
            )}
          </p>
        </header>
      )}

      {error ? (
        <AlertBanner>
          {t(
            "admin.xpConfig.loadError",
            "Failed to load XP config. Make sure you have admin access.",
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            className="ml-2"
          >
            {t("common.retry", "Retry")}
          </Button>
        </AlertBanner>
      ) : null}

      <Card padding="lg">
        {isLoading || !draft ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <label
                  key={field.name}
                  className="flex flex-col gap-1"
                  htmlFor={`xp-${field.name}`}
                >
                  <span className="text-xs font-medium uppercase text-text-muted">
                    {t(field.labelKey, field.labelFallback)}
                  </span>
                  <input
                    id={`xp-${field.name}`}
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    step={1}
                    value={String(draft[field.name] ?? 0)}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    disabled={saveMutation.isPending}
                    className={cn("w-full", inputClassName)}
                  />
                  <span className="text-xs text-text-muted">
                    {t(field.helpKey, field.helpFallback)}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={!dirty || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? t("common.loading")
                  : t("admin.xpConfig.save", "Save XP config")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={!dirty || saveMutation.isPending}
              >
                {t("common.discard", "Discard changes")}
              </Button>
              {dirty ? (
                <span className="text-xs text-warning">
                  {t("admin.xpConfig.unsaved", "Unsaved changes")}
                </span>
              ) : null}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default PlatformXpRatesPanel;
