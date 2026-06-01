import { useTranslation } from "react-i18next";
import { PlainText } from "@/shared/components/PlainText";
import type { Flashcard, CardSegment } from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

function getParticleById(particles: ParticleDef[] | null, id: string): ParticleDef | undefined {
  return particles?.find((p) => p.id === id);
}

function getSegments(card: Flashcard): CardSegment[] | undefined {
  if (card.type === "word") return card.parts;
  if (card.type === "sentence") return card.words;
  return undefined;
}

/**
 * Does this card have any extra info worth showing in the detail sidebar?
 * Cards with nothing get no sidebar at all (clean centered layout).
 */
export function hasSidebarContent(card: Flashcard): boolean {
  if (card.note) return true;
  if (card.reasoning) return true;
  if (card.definition) return true;
  if (card.context) return true;
  const segs = getSegments(card);
  if (segs && segs.length > 0) return true;
  return false;
}

type Layout = "sidebar" | "stacked";

/**
 * Detail panel for a flashcard: breakdown / note / definition / context /
 * reasoning. Rendered only after the user reveals the answer.
 *
 * Two layout modes:
 *   - `sidebar`: ~300px off-center column on `lg:`+ viewports
 *   - `stacked`: full-width block underneath the card on small screens
 *
 * Returns `null` if the card has no extra info.
 */
export function FlashcardDetailSidebar({
  card,
  particles,
  layout,
}: {
  card: Flashcard;
  particles: ParticleDef[] | null;
  layout: Layout;
}) {
  const { t } = useTranslation();
  if (!hasSidebarContent(card)) return null;
  const segments = getSegments(card);

  const containerClass =
    layout === "sidebar"
      ? "hidden lg:block lg:w-[300px] lg:shrink-0"
      : "lg:hidden";

  return (
    <aside className={containerClass} aria-label={t("flashcards.detailsLabel", "Card details")}>
      <div className="space-y-3 rounded-lg border border-border bg-surface-muted p-4 text-sm">
        {segments && segments.length > 0 && (
          <section>
            <span className="text-xs font-medium text-text-muted">
              {t("flashcards.segmentBreakdown", "Segment breakdown")}
            </span>
            <div className="mt-1.5 space-y-1 text-xs">
              {segments.map((seg, i) => {
                const particle = seg.particleId ? getParticleById(particles, seg.particleId) : undefined;
                return (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded bg-surface px-2 py-1"
                  >
                    <span className="font-medium text-text-primary">{seg.segment}</span>
                    {seg.meaning && (
                      <span className="text-text-muted">| {seg.meaning}</span>
                    )}
                    {particle && (
                      <span className="text-warning">
                        | {particle.form}: {particle.meaning}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(card.note || card.definition || card.context) && (
          <section className={segments && segments.length > 0 ? "border-t border-border pt-2" : ""}>
            {card.note && (
              <div className="text-text-secondary">
                <PlainText>{card.note}</PlainText>
              </div>
            )}
            {card.definition && (
              <div className="mt-1 font-medium text-text-primary">
                <PlainText>{card.definition}</PlainText>
              </div>
            )}
            {card.context && (
              <div className="mt-0.5 text-text-muted">
                <PlainText>{card.context}</PlainText>
              </div>
            )}
          </section>
        )}

        {card.reasoning && (
          <section className="border-t border-border pt-2 text-text-muted">
            <span className="text-xs font-medium text-text-secondary">
              {t("flashcards.reasoning", "Reasoning")}
            </span>
            <div className="mt-1">
              <PlainText>{card.reasoning}</PlainText>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
