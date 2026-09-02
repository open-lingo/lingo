import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sheet, Badge } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { VocabArt } from "./VocabArt";
import { CardFront } from "@/features/flashcards/components/CardFront";
import type { VocabRow, VocabTier } from "./vocabData";

const TIER_LABEL: Record<VocabTier, string> = {
  new: "Not started",
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
};

const TIER_VARIANT: Record<VocabTier, "neutral" | "error" | "warning" | "accent" | "success"> = {
  new: "neutral",
  learning: "warning",
  reviewing: "accent",
  mastered: "success",
};

type Props = {
  open: boolean;
  onClose: () => void;
  row: VocabRow | null;
  /** Where "Practice" sends the learner. */
  practiceTo: string;
};

/**
 * Vocab card drill-in. The "good on context" pattern from the dashboard, as a
 * right-edge Sheet: inspect a word's reading, meaning, art, and mastery without
 * leaving the browse grid.
 */
export function VocabCardSheet({ open, onClose, row, practiceTo }: Props) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onClose={onClose} side="right" title={row?.kana ?? ""}>
      {row ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
              <VocabArt row={row} size={56} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary">
                <CardFront
                  text={row.kanji ?? row.kana}
                  reading={row.kanji ? { surface: row.kanji, kana: row.kana } : undefined}
                  cardId={row.id}
                />
              </p>
              <p className="text-sm text-text-muted">{row.romaji}</p>
              <p className="mt-1 text-base text-text-secondary">{row.meaning}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={row.unlocked ? "success" : "neutral"} pill>
              {row.unlocked
                ? t("vocab.learnedBadge", "Learned")
                : t("vocab.lockedBadge", "Not yet taught")}
            </Badge>
            <Badge variant={TIER_VARIANT[row.tier]} pill>
              {t(`vocab.tier.${row.tier}`, TIER_LABEL[row.tier])}
            </Badge>
            {row.encounters > 0 && (
              <Badge variant="neutral" pill>
                {t("vocab.encounters", "{{n}} reviews", { n: row.encounters })}
              </Badge>
            )}
          </div>

          {row.encounters > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                {t("vocab.retention", "Retention")}
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${row.retention}%`,
                    backgroundColor: "rgb(var(--color-accent))",
                  }}
                />
              </div>
            </div>
          )}

          <Link
            to={practiceTo}
            onClick={onClose}
            className={composeButtonClasses({ variant: "primary", className: "w-full" })}
          >
            {t("vocab.practice", "Practice in flashcards")}
          </Link>
        </div>
      ) : null}
    </Sheet>
  );
}
