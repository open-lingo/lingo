import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { PlainText } from "@/shared/components/PlainText";
import { playLocalAudio } from "@/shared/audio/volume";
import type { Flashcard, CardSegment, Example } from "@/features/flashcards/data/types";
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
  if (card.examples && card.examples.length > 0) return true;
  const segs = getSegments(card);
  if (segs && segs.length > 0) return true;
  return false;
}

const MAX_EXAMPLES_COLLAPSED = 3;

function ExamplesList({ examples }: { examples: Example[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? examples : examples.slice(0, MAX_EXAMPLES_COLLAPSED);
  const remaining = examples.length - MAX_EXAMPLES_COLLAPSED;
  return (
    <section className="border-t border-border pt-2">
      <span className="text-xs font-medium text-text-muted">
        {t("flashcards.examples", "Examples")}
      </span>
      <ul className="mt-1.5 space-y-2">
        {visible.map((ex, i) => (
          <li key={i} className="text-xs">
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="text-text-primary">
                  <PlainText>{ex.text}</PlainText>
                </div>
                {ex.translation && (
                  <div className="mt-0.5 text-text-muted">
                    <PlainText>{ex.translation}</PlainText>
                  </div>
                )}
              </div>
              {ex.audioUrl && (
                <button
                  type="button"
                  onClick={() => playLocalAudio(ex.audioUrl!)}
                  className="shrink-0 rounded p-1 text-text-muted transition hover:bg-surface hover:text-text-primary"
                  aria-label={t("flashcards.examplePlay", "Play example audio")}
                >
                  <Icon name="volume" size={14} aria-hidden />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1.5 text-xs font-medium text-accent hover:underline"
        >
          {t("flashcards.examplesMore", "+{{count}} more", { count: remaining })}
        </button>
      )}
    </section>
  );
}

type Layout = "sidebar" | "stacked" | "overlay";

/**
 * The detail body itself (segment breakdown / note / definition / context /
 * reasoning / examples). Shared by every layout variant.
 */
function DetailBody({
  card,
  particles,
}: {
  card: Flashcard;
  particles: ParticleDef[] | null;
}) {
  const { t } = useTranslation();
  const segments = getSegments(card);
  return (
    <div className="space-y-3 text-sm">
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

      {card.examples && card.examples.length > 0 && (
        <ExamplesList examples={card.examples} />
      )}
    </div>
  );
}

/**
 * Detail panel for a flashcard. Rendered only after the user reveals the
 * answer. Returns `null` if the card has no extra info.
 *
 * Layout modes:
 *   - `sidebar`: ~300px off-center column on `lg:`+ viewports. NOTE: this is
 *     a sibling of the centered card column, so on its own it would shove the
 *     card off-center. The tester renders it inside a fixed-width spacer slot
 *     so the card stays put (see FlashcardTester).
 *   - `overlay`: absolutely-positioned panel that floats beside the card and
 *     does NOT participate in flow — zero layout shift. Used on `lg:`+.
 *   - `stacked`: full-width block underneath the card on small screens.
 */
export function FlashcardDetailSidebar({
  card,
  particles,
  layout,
  toolbar,
}: {
  card: Flashcard;
  particles: ParticleDef[] | null;
  layout: Layout;
  /** Optional toolbar rendered above the detail body (overlay variant only). */
  toolbar?: ReactNode;
}) {
  const { t } = useTranslation();
  if (!hasSidebarContent(card)) return null;

  if (layout === "overlay") {
    return (
      <aside
        aria-label={t("flashcards.detailsLabel", "Card details")}
        className="absolute left-full top-0 z-10 ml-6 hidden w-[300px] lg:block"
      >
        <div className="overflow-hidden rounded-lg border border-border bg-surface-muted shadow-card">
          {toolbar && (
            <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t("flashcards.detailsLabel", "Card details")}
              </span>
              <div className="flex items-center gap-1">{toolbar}</div>
            </div>
          )}
          <div className="p-4">
            <DetailBody card={card} particles={particles} />
          </div>
        </div>
      </aside>
    );
  }

  const containerClass =
    layout === "sidebar"
      ? "hidden lg:block lg:w-[300px] lg:shrink-0"
      : "lg:hidden";

  return (
    <aside className={containerClass} aria-label={t("flashcards.detailsLabel", "Card details")}>
      <div className="rounded-lg border border-border bg-surface-muted p-4">
        <DetailBody card={card} particles={particles} />
      </div>
    </aside>
  );
}
