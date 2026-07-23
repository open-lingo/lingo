import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "@/shared/components/ui";
import type { MasteryCell } from "../journey";

/** Token-driven colour per tier. Weakest reads hottest so decay draws the eye. */
const TIER_STYLE: Record<MasteryCell["tier"], { bg: string; label: string }> = {
  weak: { bg: "rgb(var(--color-error))", label: "Needs work" },
  fading: { bg: "rgb(var(--color-warning))", label: "Fading" },
  solid: { bg: "rgb(var(--color-accent))", label: "Solid" },
  strong: { bg: "rgb(var(--color-success))", label: "Strong" },
};

const COLLAPSED_COUNT = 24;

type Props = {
  cells: MasteryCell[];
  onSelect: (conceptId: string) => void;
};

/**
 * Per-concept strength grid off `ConceptRollup[]`. Hand-rolled — each tile is
 * coloured by recent strength (the SRS decay signal), sorted weakest-first so
 * "what's slipping" is the first thing the learner sees. Tap a tile to drill in.
 */
export function MasteryGrid({ cells, onSelect }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (cells.length === 0) {
    return (
      <Card as="section" aria-label={t("journey.mastery.title", "Mastery")}>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.mastery.title", "Mastery")}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t("journey.mastery.empty", "Practice concepts to map your strengths.")}
        </p>
      </Card>
    );
  }

  const shown = expanded ? cells : cells.slice(0, COLLAPSED_COUNT);

  return (
    <Card as="section" aria-label={t("journey.mastery.title", "Mastery")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.mastery.title", "Mastery")}
        </h2>
        <span className="text-sm text-text-muted">
          {t("journey.mastery.count", "{{count}} concepts", { count: cells.length })}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {shown.map((cell) => {
          const style = TIER_STYLE[cell.tier];
          return (
            <button
              key={cell.conceptId}
              type="button"
              onClick={() => onSelect(cell.conceptId)}
              className="flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-sm font-medium text-accent-foreground transition-transform hover:scale-105 focus-visible:scale-105"
              style={{ backgroundColor: style.bg }}
              title={`${cell.label} · ${cell.recentStrength}% · ${style.label}`}
              aria-label={`${cell.label}, ${style.label}, ${cell.recentStrength} percent recent strength`}
            >
              {cell.label}
            </button>
          );
        })}
      </div>

      {cells.length > COLLAPSED_COUNT ? (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded
              ? t("journey.mastery.less", "Show less")
              : t("journey.mastery.more", "Show all {{count}}", { count: cells.length })}
          </Button>
        </div>
      ) : null}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3" aria-hidden>
        {(Object.keys(TIER_STYLE) as MasteryCell["tier"][]).map((tier) => (
          <span key={tier} className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: TIER_STYLE[tier].bg }}
            />
            {t(`journey.mastery.tier.${tier}`, TIER_STYLE[tier].label)}
          </span>
        ))}
      </div>
    </Card>
  );
}
