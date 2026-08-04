import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui";
import type { DictionaryEntry, DictionarySource } from "@/shared/dictionary";
import { sourceLabel } from "./dictionaryLabels";

const SOURCE_BADGE: Record<DictionarySource, "neutral" | "accent" | "success"> = {
  course: "success",
  frequency: "accent",
  both: "accent",
};

/** One scannable dictionary row: surface, reading, meaning, source/freq badge. */
export function DictionaryEntryRow({
  entry,
  onOpen,
  sourceText,
}: {
  entry: DictionaryEntry;
  onOpen: () => void;
  sourceText: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left transition hover:border-accent hover:shadow-card"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate text-lg font-semibold text-text-primary">
            {entry.surface}
          </span>
          {entry.reading && entry.reading !== entry.surface && (
            <span className="truncate text-xs text-text-muted">{entry.reading}</span>
          )}
        </p>
        <p className="truncate text-sm text-text-secondary">{entry.meaningEn}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {entry.frequencyRank != null && (
          <span className="text-[11px] tabular-nums text-text-muted">
            #{entry.frequencyRank}
          </span>
        )}
        <Badge variant={SOURCE_BADGE[entry.source]} size="sm" pill>
          {sourceText}
        </Badge>
      </div>
    </button>
  );
}

/**
 * A list of dictionary result rows. Shared by the full Dictionary page (browse
 * + search) and the lookup modal so the row rendering stays in one place.
 */
export function DictionaryResultsList({
  entries,
  onOpen,
}: {
  entries: DictionaryEntry[];
  onOpen: (entry: DictionaryEntry) => void;
}) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {/* Keyed by id AND meaning: the course data registers several senses of
          one surface under a single atom id (KO 이 = "two" / "this" / subject
          marker), so `id` alone is not unique in a sense list. */}
      {entries.map((entry) => (
        <li key={`${entry.id}|${entry.meaningEn}`}>
          <DictionaryEntryRow
            entry={entry}
            onOpen={() => onOpen(entry)}
            sourceText={sourceLabel(t, entry.source)}
          />
        </li>
      ))}
    </ul>
  );
}
