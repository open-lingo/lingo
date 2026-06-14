import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type {
  DeckStats,
  DeckDifficultyBand,
} from "@/features/flashcards/deckStats";

const BAND_LABELS: Record<DeckDifficultyBand, string> = {
  easy: "flashcards.difficultyEasy",
  medium: "flashcards.difficultyMedium",
  hard: "flashcards.difficultyHard",
};

const BAND_BAR: Record<DeckDifficultyBand, string> = {
  easy: "bg-success",
  medium: "bg-warning",
  hard: "bg-danger",
};

const BAND_CHIP: Record<DeckDifficultyBand, string> = {
  easy: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  hard: "bg-danger/15 text-danger",
};

const BANDS: DeckDifficultyBand[] = ["easy", "medium", "hard"];

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * DeckStatsPanel — the "what am I signing up for" block: overall difficulty
 * chip, the simple/complex content mix, and a per-band difficulty
 * distribution bar. All values are content-derived (see deckStats.ts) and
 * degrade gracefully on an empty deck.
 */
export function DeckStatsPanel({ stats }: { stats: DeckStats }) {
  const { t } = useTranslation();
  const { total, complex, simple, difficulty, overall } = stats;

  return (
    <div className="space-y-4">
      {/* Overall difficulty + complexity mix */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
            BAND_CHIP[overall],
          )}
        >
          <Icon name="barChart" size={13} aria-hidden />
          {t(BAND_LABELS[overall])}
        </span>
        {total > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon name="sparkles" size={13} aria-hidden />
            {t("flashcards.complexityMix", {
              defaultValue: "{{complex}} complex · {{simple}} simple",
              complex,
              simple,
            })}
          </span>
        )}
      </div>

      {/* Simple vs complex split bar */}
      {total > 0 && (
        <div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="bg-accent"
              style={{ width: `${pct(complex, total)}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-muted">
            <span>
              {pct(complex, total)}% {t("flashcards.complexLabel", "complex")}
            </span>
            <span>
              {pct(simple, total)}% {t("flashcards.simpleLabel", "simple")}
            </span>
          </div>
        </div>
      )}

      {/* Difficulty distribution */}
      {total > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("flashcards.difficultyDistribution", "Difficulty mix")}
          </p>
          {BANDS.map((band) => {
            const count = difficulty[band];
            return (
              <div key={band} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs text-text-secondary">
                  {t(BAND_LABELS[band])}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={cn("h-full rounded-full", BAND_BAR[band])}
                    style={{ width: `${pct(count, total)}%` }}
                    aria-hidden
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
