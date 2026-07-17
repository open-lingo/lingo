import type { SRSModality } from "@/features/flashcards/data/types";

/**
 * Tasteful color differentiation between the two review modalities, all via
 * theme tokens so dark / amoled / custom themes stay coherent.
 *
 *   - recognition → `info` (you're recognizing a shown word)
 *   - production  → `accent` (you're producing the target language)
 *
 * Returned classes are Tailwind utilities referencing CSS-var-backed tokens.
 */
export type ModalityTheme = {
  /** Icon name in the registry. */
  icon: "search" | "mic";
  /** Text color utility for the label. */
  text: string;
  /** Soft tinted chip (bg + text) for the modality indicator pill. */
  chip: string;
  /** Card top-accent rail color (border-t utility). */
  rail: string;
  /** Ring color when the card is the active modality (focus-style accent). */
  ring: string;
};

const RECOGNITION: ModalityTheme = {
  icon: "search",
  text: "text-info",
  chip: "bg-info/10 text-info",
  rail: "border-t-info",
  ring: "ring-info/40",
};

const PRODUCTION: ModalityTheme = {
  icon: "mic",
  text: "text-accent",
  chip: "bg-accent-muted text-accent",
  rail: "border-t-accent",
  ring: "ring-accent/40",
};

export function getModalityTheme(modality: SRSModality): ModalityTheme {
  return modality === "recognition" ? RECOGNITION : PRODUCTION;
}
