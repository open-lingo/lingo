import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/shared/components/ui/Sheet";
import {
  FlashcardDetailBody,
  hasSidebarContent,
} from "./FlashcardDetailSidebar";
import type { Flashcard } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

/**
 * Everything the phone screen used to stack below the card, in one bottom
 * sheet: the card's detail body, the session counts, and the review settings.
 *
 * One sheet, not three: on a phone each of these is a two-tap detour and three
 * separate overlays would be three separate close gestures. Both toolbar
 * affordances open this, and `initialSection` decides which heading is scrolled
 * to — details from the details icon, session from the gear.
 *
 * `side="auto"` (Task 3) means this same component is a right-hand drawer at
 * `md`+ if it is ever mounted there. Today it is not: above `md` the reviewer
 * keeps its in-flow detail panel, its stats strip and its anchored settings
 * popover, unchanged.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  initialSection: "details" | "session";
  card: Flashcard;
  particles: ParticleDef[] | null;
  stats: {
    reviewed: number;
    newRemaining: number;
    dueRemaining: number;
    dueBreakdown: { recognition: number; production: number };
    againQueued: number;
    extraCount?: number;
  };
  settings: ReactNode;
};

export function ReviewDetailsSheet({
  open,
  onClose,
  initialSection,
  card,
  particles,
  stats,
  settings,
}: Props) {
  const { t } = useTranslation();
  const sessionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialSection !== "session") return;
    sessionRef.current?.scrollIntoView({ block: "start" });
  }, [open, initialSection]);

  const showDetails = hasSidebarContent(card);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="auto"
      title={t("flashcards.detailsLabel", "Card details")}
    >
      <div className="space-y-5">
        {showDetails && (
          <section>
            <FlashcardDetailBody card={card} particles={particles} />
          </section>
        )}

        <section ref={sessionRef} className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("flashcards.sessionSectionLabel", "This session")}
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.reviewed")}</dt>
              <dd className="font-semibold text-text-primary">{stats.reviewed}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.newCount")}</dt>
              <dd className="font-semibold text-text-primary">
                {stats.newRemaining}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.dueCount")}</dt>
              <dd className="font-semibold text-text-primary">
                {stats.dueRemaining}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t("flashcards.againCount")}</dt>
              <dd className="font-semibold text-warning">{stats.againQueued}</dd>
            </div>
            {typeof stats.extraCount === "number" && stats.extraCount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">
                  {t("flashcards.extraCount", "Extra")}
                </dt>
                <dd className="font-semibold text-accent">{stats.extraCount}</dd>
              </div>
            )}
          </dl>
          {/* The desktop stats strip puts this split in a hover tooltip. There
              is no hover on a phone, so it becomes a line of text. */}
          <p className="mt-2 text-xs text-text-muted">
            {t("flashcards.dueBreakdownRecognition", "{{count}} due for recognition", {
              count: stats.dueBreakdown.recognition,
            })}
            {" · "}
            {t("flashcards.dueBreakdownProduction", "{{count}} due for production", {
              count: stats.dueBreakdown.production,
            })}
          </p>
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("flashcards.reviewSettings", "Review settings")}
          </h3>
          {settings}
        </section>
      </div>
    </Sheet>
  );
}
