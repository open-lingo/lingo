import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import {
  getVerbsUpToModule,
  getAdjsUpToModule,
} from "@/features/languages/ja/conjugationTables";
import { conjugateVerb } from "@/features/languages/ja/conjugationEngine";
import type { ConjugationTrainerType } from "./trainerRegistry";

/**
 * The formation cheat sheet for one trainer type: authored FormationRow grid
 * (every row-ending / group difference) + a "your words" strip from the
 * reached-module pool. Extracted from TrainerTypeSession so the drill card's
 * cheat-sheet modal can render it too (the standalone Cheat-sheet tab was
 * folded into this button — Spencer 2026-07-05).
 */
export function CheatSheet({
  type,
  reachedModule,
}: {
  type: ConjugationTrainerType;
  reachedModule: number;
}) {
  const { t } = useTranslation();

  const yourItems = useMemo(() => {
    if (type.category === "verb") {
      const form = type.verbForms?.[0];
      if (!form) return [];
      return getVerbsUpToModule(reachedModule)
        .slice(0, 8)
        .map((v) => ({ dict: v.dictionary, form: conjugateVerb(v.dictionary, v.group, form) }));
    }
    const form = type.adjForms?.[0];
    if (!form) return [];
    return getAdjsUpToModule(reachedModule)
      .filter((a) => a.type === "i-adj")
      .slice(0, 8)
      .map((a) => ({ dict: a.dictionary, form: a.forms[form] }));
  }, [type, reachedModule]);

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-2 font-semibold">
                {t("practice.conjugation.groupHeader", { defaultValue: "Group" })}
              </th>
              <th className="px-4 py-2 font-semibold">
                {t("practice.conjugation.patternHeader", { defaultValue: "Pattern" })}
              </th>
              <th className="px-4 py-2 font-semibold">
                {t("practice.conjugation.exampleHeader", { defaultValue: "Example" })}
              </th>
            </tr>
          </thead>
          <tbody>
            {type.formation.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-text-secondary">{row.groupLabel}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary" lang="ja">
                  {row.pattern}
                </td>
                <td className="px-4 py-2.5 text-text-primary" lang="ja">
                  {row.exampleDict} → {row.exampleForm}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {yourItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {type.category === "verb"
              ? t("practice.conjugation.yourVerbs", { defaultValue: "Your verbs" })
              : t("practice.conjugation.yourAdjectives", { defaultValue: "Your adjectives" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {yourItems.map((it, i) => (
              <span
                key={i}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                lang="ja"
              >
                {it.dict} → {it.form}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
