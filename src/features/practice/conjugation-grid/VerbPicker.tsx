import { useTranslation } from "react-i18next";
import { cn } from "@/shared/components/ui";
import type { EsVerbEntry } from "@/features/languages/es/conjugationTables";

const GROUP_ORDER: Array<EsVerbEntry["group"]> = ["ar", "er", "ir", "irregular"];

/**
 * Verb picker grouped by conjugation class. Locks are ADVISORY in the house
 * style (the hub says "Recommended from Module N — open anyway"): a verb the
 * course hasn't reached yet is still selectable, it just wears a muted
 * "M{n}" chip — mirror of the ja hub's learn-ahead chip, never a hard block.
 */
export function VerbPicker({
  entries,
  reachedModule,
  selectedId,
  onSelect,
}: {
  entries: EsVerbEntry[];
  reachedModule: number;
  selectedId: string | null;
  onSelect: (verbId: string) => void;
}) {
  const { t } = useTranslation();
  const GROUP_LABELS: Record<EsVerbEntry["group"], string> = {
    ar: t("practice.conjugationGrid.groupAr", { defaultValue: "-ar verbs" }),
    er: t("practice.conjugationGrid.groupEr", { defaultValue: "-er verbs" }),
    ir: t("practice.conjugationGrid.groupIr", { defaultValue: "-ir verbs" }),
    irregular: t("practice.conjugationGrid.groupIrregular", { defaultValue: "Irregular" }),
  };

  return (
    <div className="space-y-3">
      {GROUP_ORDER.map((group) => {
        const verbs = entries.filter((v) => v.group === group);
        if (verbs.length === 0) return null;
        return (
          <div key={group}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {GROUP_LABELS[group]}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {verbs.map((verb) => (
                <VerbTile
                  key={verb.id}
                  verb={verb}
                  ahead={verb.introducedAtModule > reachedModule}
                  selected={verb.id === selectedId}
                  onSelect={() => onSelect(verb.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerbTile({
  verb,
  ahead,
  selected,
  onSelect,
}: {
  verb: EsVerbEntry;
  ahead: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-start rounded-xl border bg-surface px-3 py-2 text-left transition-all duration-150 active:translate-y-[2px]",
        selected
          ? "-translate-y-0.5 border-2 border-accent shadow-card"
          : "border-border hover:border-accent",
        ahead && !selected && "opacity-70",
      )}
    >
      <span
        lang="es"
        className={cn("text-base font-bold", selected ? "text-accent" : "text-text-primary")}
      >
        {verb.lemma}
      </span>
      <span className="truncate text-[11px] text-text-muted">{verb.meaning}</span>
      {/* Advisory module chip — where the course introduces this verb.
          Ahead-of-path verbs stay clickable (never hard-block). */}
      {ahead && (
        <span className="absolute right-1.5 top-1.5 whitespace-nowrap rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
          {t("practice.conjugationGrid.aheadChip", {
            defaultValue: "M{{module}}",
            module: verb.introducedAtModule,
          })}
        </span>
      )}
    </button>
  );
}
