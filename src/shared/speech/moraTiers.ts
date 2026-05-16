/**
 * Mora-aware threshold scaling for STT verdicts.
 *
 * Whisper struggles more on short utterances — the 30-second window
 * model pads aggressively and is prone to hallucination on sub-second
 * audio. A single mora miss on a 2-mora word is a 50% relative error,
 * but the same miss on a 7-mora word is ~14%. Static thresholds
 * over-punish short targets. Scale them by target length instead.
 *
 * Bands (Spencer 2026-05-15):
 *   <5 mora  → perfect=0.30  close=0.15
 *   5–7 mora → perfect=0.60  close=0.40
 *   ≥8 mora  → perfect=0.70  close=0.55  (≈ original defaults)
 *
 * Explicit `?speech-perfect` / `?speech-close` URL overrides bypass
 * this entirely so we can A/B-tune without rebuilding.
 */
import { countMora } from "@/shared/japanese/mora";
import type { MatchTiers } from "./loose-match";
import { SPEECH_DEFAULTS, type SpeechConfig } from "./featureFlag";

export type MoraBand = "short" | "mid" | "long";

export function classifyMoraBand(mora: number): MoraBand {
  if (mora < 5) return "short";
  if (mora < 8) return "mid";
  return "long";
}

const BAND_TIERS: Record<MoraBand, { perfect: number; close: number }> = {
  short: { perfect: 0.3, close: 0.15 },
  mid: { perfect: 0.6, close: 0.4 },
  long: { perfect: 0.7, close: 0.55 },
};

/**
 * Resolve the right `MatchTiers` for a target string, honoring any
 * explicit URL overrides in `cfg`. If the user has touched the perfect
 * or close dials in their URL (non-default values), we use those as-is;
 * otherwise we pick from the mora band.
 */
export function tiersForTarget(target: string, cfg: SpeechConfig): MatchTiers {
  const perfectOverridden =
    cfg.perfectThreshold !== SPEECH_DEFAULTS.perfectThreshold;
  const closeOverridden =
    cfg.closeThreshold !== SPEECH_DEFAULTS.closeThreshold;

  if (perfectOverridden || closeOverridden) {
    return {
      perfect: cfg.perfectThreshold,
      close: cfg.closeThreshold,
      strict: cfg.strict,
    };
  }

  const band = classifyMoraBand(countMora(target));
  const { perfect, close } = BAND_TIERS[band];
  return { perfect, close, strict: cfg.strict };
}
