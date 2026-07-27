import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, ResponsiveTable } from "@/shared/components/ui";
import type { ConjugationTrainerProvider, ConjTrainerTypeMeta } from "@/shared/conjugation/types";

/**
 * The formation cheat sheet for one trainer type: the provider's authored
 * FormationRow grid + a "your words" strip conjugated from the reached-module
 * pool. Fully provider-driven — no per-language linguistics here.
 */
export function CheatSheet({
  conj,
  type,
  reachedModule,
}: {
  conj: ConjugationTrainerProvider;
  type: ConjTrainerTypeMeta;
  reachedModule: number;
}) {
  const { t } = useTranslation();

  const yourItems = useMemo(
    () => conj.cheatItems(type.id, reachedModule),
    [conj, type.id, reachedModule],
  );

  return (
    <div className="space-y-4">
      <Card padding="none" className="overflow-hidden">
        <ResponsiveTable>
          <table className="min-w-full text-sm">
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
                  <td className="px-4 py-2.5 font-medium text-text-primary">{row.pattern}</td>
                  <td className="px-4 py-2.5 text-text-primary">
                    {row.exampleDict} → {row.exampleForm}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
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
