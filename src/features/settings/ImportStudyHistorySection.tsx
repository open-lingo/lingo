/**
 * Settings → "Import study history" card (anki-import-spec-2026-07-07 §UI).
 *
 * Dev-gated for v1 (the caller renders it only under `import.meta.env.DEV`,
 * the same gate DevPanel visibility uses). Flow: file input (.json) → parse →
 * preview counts + "Unlock matched words" toggle (default ON) → APPLY →
 * report with a downloadable unmatched-items JSON blob. Parse failures surface
 * the `ImportParseError` message inline.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/shared/components/ui/Switch";
import { SectionHeader, SettingsGroup, SettingRow } from "./SettingsPrimitives";
import {
  parseKnownItemsExport,
  ImportParseError,
} from "@/features/flashcards/import/parse";
import {
  computeImportPreview,
  type ImportPreview,
} from "@/features/flashcards/import/preview";
import { applyImport } from "@/features/flashcards/import/seed";
import type { ImportReport } from "@/features/flashcards/import/types";

type Stage = "idle" | "preview" | "done";

const CTA =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50";

export function ImportStudyHistorySection() {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [unlock, setUnlock] = useState(true);
  const [report, setReport] = useState<ImportReport | null>(null);

  const reset = () => {
    setStage("idle");
    setError(null);
    setPreview(null);
    setReport(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    setReport(null);
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new ImportParseError(
          t("settings.import.errInvalidJson", "That file isn't valid JSON."),
        );
      }
      const exp = parseKnownItemsExport(json);
      setPreview(computeImportPreview(exp));
      setStage("preview");
    } catch (err) {
      setPreview(null);
      setStage("idle");
      setError(
        err instanceof ImportParseError
          ? err.message
          : t("settings.import.errGeneric", "Couldn't read that import file."),
      );
    }
  };

  const onApply = () => {
    if (!preview) return;
    const result = applyImport(preview.matches, {
      unlockAtoms: unlock,
      unmatched: preview.unmatched,
    });
    setReport(result);
    setStage("done");
  };

  const downloadUnmatched = () => {
    if (!report || report.unmatched.length === 0) return;
    const blob = new Blob([JSON.stringify(report.unmatched, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lingo-unmatched-items.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <SettingsGroup label={t("settings.import.group", "Import study history")}>
      <div className="space-y-4 px-4 py-3.5">
        <SectionHeader
          title={t("settings.import.title", "Import from Anki")}
          description={t(
            "settings.import.help",
            "Bring evidence of words you already know from an Anki export. This seeds review scheduling and unlocks matched words — it never marks lessons complete or moves your course position.",
          )}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error"
          >
            {error}
          </p>
        ) : null}

        {stage === "idle" ? (
          <label className={`${CTA} cursor-pointer border border-border bg-surface text-text-primary hover:bg-surface-muted`}>
            {t("settings.import.chooseFile", "Choose export file (.json)")}
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={onFile}
            />
          </label>
        ) : null}

        {stage === "preview" && preview ? (
          <div className="space-y-4">
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <PreviewStat
                label={t("settings.import.statItems", "Items")}
                value={preview.totalItems}
              />
              <PreviewStat
                label={t("settings.import.statMatched", "Match words")}
                value={preview.matchAtoms}
              />
              <PreviewStat
                label={t("settings.import.statTracked", "Already tracked")}
                value={preview.alreadyTracked}
              />
              <PreviewStat
                label={t("settings.import.statBeyond", "Beyond course")}
                value={preview.beyondCourse}
              />
            </ul>

            <SettingRow
              asLabel
              label={t("settings.import.unlockLabel", "Unlock matched words")}
              help={t(
                "settings.import.unlockHelp",
                "Add matched words to your unlocked set so they surface in reviews. This is a real account change.",
              )}
              control={
                <Switch
                  checked={unlock}
                  onCheckedChange={setUnlock}
                  ariaLabel={t("settings.import.unlockLabel", "Unlock matched words")}
                />
              }
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onApply}
                className={`${CTA} bg-accent text-accent-foreground hover:bg-accent-hover`}
              >
                {t("settings.import.apply", "Import {{count}} words", {
                  count: preview.matchAtoms,
                })}
              </button>
              <button
                type="button"
                onClick={reset}
                className={`${CTA} border border-border bg-surface text-text-secondary hover:bg-surface-muted`}
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </div>
        ) : null}

        {stage === "done" && report ? (
          <div className="space-y-4">
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <PreviewStat
                label={t("settings.import.statSeeded", "Seeded")}
                value={report.seededCards}
              />
              <PreviewStat
                label={t("settings.import.statSkipped", "Kept (already known)")}
                value={report.skippedExisting}
              />
              <PreviewStat
                label={t("settings.import.statUnlocked", "Unlocked")}
                value={report.unlockedAtoms}
              />
              <PreviewStat
                label={t("settings.import.statBeyond", "Beyond course")}
                value={report.unmatched.length}
              />
            </ul>
            <div className="flex flex-wrap gap-2">
              {report.unmatched.length > 0 ? (
                <button
                  type="button"
                  onClick={downloadUnmatched}
                  className={`${CTA} border border-border bg-surface text-text-primary hover:bg-surface-muted`}
                >
                  {t("settings.import.downloadUnmatched", "Download unmatched ({{count}})", {
                    count: report.unmatched.length,
                  })}
                </button>
              ) : null}
              <button
                type="button"
                onClick={reset}
                className={`${CTA} border border-border bg-surface text-text-secondary hover:bg-surface-muted`}
              >
                {t("settings.import.done", "Done")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </SettingsGroup>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-card border border-border bg-surface px-3 py-2">
      <div className="text-lg font-semibold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </li>
  );
}
