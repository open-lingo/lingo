import { useTranslation } from "react-i18next";
import { Sheet, Badge } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio } from "@/shared/tts";
import type { DictionaryEntry, DictionarySource } from "@/shared/dictionary";
import { posLabel, sourceLabel } from "./dictionaryLabels";

const SOURCE_VARIANT: Record<DictionarySource, "neutral" | "accent" | "success"> = {
  course: "success",
  frequency: "accent",
  both: "accent",
};

type Props = {
  open: boolean;
  onClose: () => void;
  entry: DictionaryEntry | null;
  /** Deep-link into the conjugation trainer for conjugable entries. */
  conjugationTo?: string;
};

/**
 * Reference drill-in for a single dictionary word. Read-only: surface, reading,
 * meaning, part of speech, frequency rank, unlock module, source — plus an audio
 * button (recorded clip when `hasAudio`, platform voice otherwise) and, for
 * conjugables, the paradigm table straight from `entry.conjugation.forms`.
 */
export function DictionaryEntrySheet({ open, onClose, entry, conjugationTo }: Props) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onClose={onClose} side="right" title={entry?.surface ?? ""}>
      {entry ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-3xl font-bold leading-tight text-text-primary">
                {entry.surface}
              </p>
              {entry.reading && entry.reading !== entry.surface && (
                <p className="mt-0.5 text-sm text-text-muted">{entry.reading}</p>
              )}
              <p className="mt-2 text-base text-text-secondary">{entry.meaningEn}</p>
            </div>
            <button
              type="button"
              onClick={() => void playJaAudio(entry.surface, entry.languageId)}
              aria-label={t("dictionary.playAudio", "Play pronunciation")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition hover:border-accent hover:text-accent"
            >
              <Icon name="volume" size={20} aria-hidden />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral" pill>
              {posLabel(t, entry.pos)}
            </Badge>
            <Badge variant={SOURCE_VARIANT[entry.source]} pill>
              {sourceLabel(t, entry.source)}
            </Badge>
            {entry.frequencyRank != null && (
              <Badge variant="info" pill>
                {t("dictionary.rankBadge", "#{{rank}} most frequent", {
                  rank: entry.frequencyRank,
                })}
              </Badge>
            )}
            {entry.unlockModule && (
              <Badge variant="neutral" pill>
                {t("dictionary.unlockBadge", "Unlocks {{module}}", {
                  module: entry.unlockModule,
                })}
              </Badge>
            )}
          </div>

          {entry.conjugation && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  {t("dictionary.conjugation", "Conjugation")}
                </p>
                {conjugationTo && (
                  <a
                    href={conjugationTo}
                    className="text-xs font-medium text-accent underline-offset-2 hover:underline"
                  >
                    {t("dictionary.practiceConjugation", "Practice")}
                  </a>
                )}
              </div>
              <dl className="overflow-hidden rounded-card border border-border">
                {Object.entries(entry.conjugation.forms).map(([form, value], i) => (
                  <div
                    key={form}
                    className={`flex items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                      i % 2 === 1 ? "bg-surface-muted" : ""
                    }`}
                  >
                    <dt className="shrink-0 text-text-muted">{form}</dt>
                    <dd className="min-w-0 truncate text-right font-medium text-text-primary">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      ) : null}
    </Sheet>
  );
}
