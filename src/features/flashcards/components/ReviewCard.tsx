import { useTranslation } from "react-i18next";
import { PlainText } from "@/shared/components/PlainText";
import { CardImage } from "../CardPreview";
import { CardFront } from "./CardFront";
import { getModalityTheme } from "../modalityTheme";
import type {
  Flashcard,
  CardSegment,
  SRSModality,
} from "@/features/flashcards/data/types";
import type { ParticleDef } from "@/features/practice/data/types";

function getParticleById(
  particles: ParticleDef[] | null,
  id: string,
): ParticleDef | undefined {
  return particles?.find((p) => p.id === id);
}

function HighlightedText({
  segments,
  particles,
  highlightMode,
}: {
  segments: CardSegment[];
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  if (!segments?.length) return null;
  return (
    <span>
      {segments.map((seg, i) => {
        const particle = seg.particleId
          ? getParticleById(particles, seg.particleId)
          : undefined;
        const isParticle = Boolean(seg.particleId && particle);
        const isRoot = Boolean(highlightMode && seg.meaning && !seg.particleId);
        if (highlightMode && isParticle) {
          return (
            <mark
              key={i}
              className="rounded bg-warning/30 px-0.5"
              title={particle ? `${particle.form}: ${particle.meaning}` : undefined}
            >
              {seg.segment}
            </mark>
          );
        }
        if (isRoot) {
          return (
            <mark key={i} className="rounded bg-success/30 px-0.5" title={seg.meaning}>
              {seg.segment}
            </mark>
          );
        }
        return <span key={i}>{seg.segment}</span>;
      })}
    </span>
  );
}

function CardFace({
  card,
  side,
  face,
  particles,
  highlightMode,
}: {
  card: Flashcard;
  side: "front" | "back";
  face: "prompt" | "answer";
  particles: ParticleDef[] | null;
  highlightMode: boolean;
}) {
  const isFront = side === "front";
  if (isFront) {
    if (highlightMode && card.type === "word" && card.parts?.length) {
      return (
        <HighlightedText segments={card.parts} particles={particles} highlightMode />
      );
    }
    if (highlightMode && card.type === "sentence" && card.words?.length) {
      return (
        <HighlightedText segments={card.words} particles={particles} highlightMode />
      );
    }
    return (
      <CardFront
        text={card.front}
        reading={card.reading}
        cardId={card.id}
        face={face}
      />
    );
  }
  return <PlainText>{card.back}</PlainText>;
}

/**
 * The flip surface.
 *
 * Height is the whole reason this is a component and not inline JSX. On
 * desktop it keeps the historical `min-h-[360px]` floor: EVERY card reserves
 * the same block, image or not, so the grade buttons below never shift between
 * cards and never move under a cursor mid-grade (Spencer QA 2026-07-13).
 *
 * On the fitted mobile stage that floor is wrong — 360px plus chrome plus the
 * grade row does not fit an iPhone SE, and a hard px floor inside a fitted
 * shell is exactly the overflow the shell exists to prevent. There the card is
 * `flex-1` instead: it takes precisely the space the stage has left over, which
 * gives the same guarantee (the grade row cannot jump, because the card's
 * height is a function of the stage, not of the card) with no overflow. The
 * image cap follows suit — `18cqh` of the scroller instead of a fixed 128px.
 */
type Props = {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  testedModality: SRSModality;
  particles: ParticleDef[] | null;
  highlightMode: boolean;
  /** Mobile fitted stage: fill the leftover space instead of reserving 360px. */
  fitted: boolean;
};

export function ReviewCard({
  card,
  flipped,
  onFlip,
  testedModality,
  particles,
  highlightMode,
  fitted,
}: Props) {
  const { t } = useTranslation();
  const modalityTheme = getModalityTheme(testedModality);
  return (
    <button
      type="button"
      onClick={onFlip}
      className={`flex w-full flex-col items-center justify-center rounded-card border-2 border-t-4 border-border bg-surface shadow-sm transition hover:border-accent ${
        modalityTheme.rail
      } ${
        fitted
          ? "min-h-0 flex-1 overflow-hidden px-4 py-6"
          : "min-h-[360px] py-12"
      }`}
    >
      {flipped && card.image && (
        <CardImage
          src={card.image}
          className={`mb-3 w-auto rounded object-contain ${
            fitted ? "max-h-[18cqh]" : "max-h-32"
          }`}
        />
      )}
      <p className="text-center text-3xl font-medium text-text-primary">
        <CardFace
          card={card}
          side={
            // Recognition: shown target script (front) → recall meaning (back).
            // Production:  cued English (back) → produce the target (front).
            // This mapping was INVERTED until 2026-07-02; the engine definition
            // in types.ts and every lesson/grammar grading surface use the sense
            // above, so the reviewer matches them.
            testedModality === "recognition"
              ? flipped
                ? "back"
                : "front"
              : flipped
                ? "front"
                : "back"
          }
          face={flipped ? "answer" : "prompt"}
          particles={particles}
          highlightMode={highlightMode}
        />
      </p>
      <p className="mt-3 text-sm text-text-muted">
        {flipped
          ? testedModality === "recognition"
            ? t("flashcards.meaningLabel", "Meaning")
            : t("flashcards.wordLabel", "Word")
          : t("flashcards.tapToReveal", "Tap to reveal")}
      </p>
    </button>
  );
}
