/**
 * 2×2 flag-grid language picker — visual mock for the new-user audit
 * (Task #88). Mirrors the word_image_mcq card pattern: square cards,
 * flag centered ~60% of card, language name inset across the top.
 *
 * Renders ALL configured languages (not just AVAILABLE_LEARNING_LANGUAGES)
 * so the user can see how the design handles the honesty-fix from the
 * audit: ja+ko render full-color and selectable; the 5 stubs render
 * dimmed with a "Soon" badge.
 *
 * NOT wired to LanguageContext / settings yet — pure visual mock for the
 * /:lang/picker-test comparison page. Wiring happens after Spencer picks
 * a variant.
 */
import { useState } from "react";
import { LANGUAGE_CONFIGS, AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { notoFlagUrl } from "@/shared/assets/notoEmoji";

const FLAG_CODES: Record<string, string> = {
  ja: "JP",
  ko: "KR",
  zh: "CN",
  es: "ES",
  de: "DE",
  fr: "FR",
  en: "GB",
};

/**
 * Subtle per-language tint, mirroring the Learn page module-head
 * 135° linear gradient pattern. Colors evoke the country (not the
 * flag literally) at 5–10% opacity so they whisper, not shout.
 * Format: rgba pairs for `linear-gradient(135deg, from 0%, to 100%)`.
 */
const LANG_TINT: Record<string, { from: string; to: string }> = {
  ja: { from: "rgba(220, 38, 38, 0.10)",  to: "rgba(248, 113, 113, 0.04)" }, // red wash
  ko: { from: "rgba(37, 99, 235, 0.09)",  to: "rgba(220, 38, 38, 0.04)"  }, // blue→red
  zh: { from: "rgba(220, 38, 38, 0.09)",  to: "rgba(250, 204, 21, 0.05)" }, // red→gold
  es: { from: "rgba(234, 88, 12, 0.09)",  to: "rgba(250, 204, 21, 0.05)" }, // orange→yellow
  de: { from: "rgba(250, 204, 21, 0.10)", to: "rgba(180, 83, 9, 0.05)"   }, // gold→amber
  fr: { from: "rgba(37, 99, 235, 0.09)",  to: "rgba(244, 114, 182, 0.04)"}, // french blue→rose
  en: { from: "rgba(30, 64, 175, 0.09)",  to: "rgba(220, 38, 38, 0.04)"  }, // navy→red
};

// Order: shipped first (ja), then ko (stub), then the 5 unbuilt configs.
// Honest ordering signals to the user what's actually usable.
const DISPLAY_ORDER = ["ja", "ko", "zh", "es", "de", "fr", "en"];

type PickerVariant = "current" | "grid";

type Props = {
  variant: PickerVariant;
};

export function LanguagePickerGrid({ variant }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const langs = DISPLAY_ORDER
    .map((id) => LANGUAGE_CONFIGS[id])
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const available = new Set<string>(AVAILABLE_LEARNING_LANGUAGE_IDS);

  if (variant === "current") {
    // Re-creation of the existing LanguagePickerModal inline so the
    // comparison is apples-to-apples (the real one is modal-only).
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-lg font-bold text-text-primary">
          Pick your language
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          You can change this any time from settings.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {langs
            .filter((l) => available.has(l.id))
            .map((lang) => {
              const isSelected = selected === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelected(lang.id)}
                  className={
                    "flex items-center gap-2 rounded-lg border px-4 py-3 text-left transition " +
                    (isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:border-accent hover:bg-surface-muted")
                  }
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-text-primary">
                    {lang.name}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    );
  }

  // Grid variant — 2 cols mobile, 3 cols sm+. Each card mirrors the
  // word_image_mcq pattern.
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-xl font-bold text-text-primary">
        What do you want to learn?
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Pick a language to get started. You can switch later.
      </p>

      <div className="relative mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {langs.map((lang) => {
          const isAvailable = available.has(lang.id);
          const isSelected = selected === lang.id;
          const flagSrc = notoFlagUrl(FLAG_CODES[lang.id] ?? "");

          // Bumped from shadow-card → shadow-md/lg/xl for more depth at
          // rest. Hover lifts higher; press snaps back. Selected gets a
          // stronger accent fill + ring halo so the pick reads committed.
          let stateClasses =
            "border-border shadow-md hover:-translate-y-0.5 hover:border-accent hover:shadow-xl active:translate-y-0 active:shadow-md";
          if (isSelected) {
            stateClasses =
              "border-accent shadow-xl ring-2 ring-accent/25 ring-offset-2 ring-offset-surface";
          }
          if (!isAvailable) {
            stateClasses =
              "border-border opacity-55 cursor-not-allowed shadow-none";
          }

          // Per-language tint layered over the surface color. The
          // accent overlay on selected sits on top of the tint so the
          // pick still reads, just warmer.
          const tint = LANG_TINT[lang.id];
          const bgLayers: string[] = [];
          if (isSelected) {
            // Slight accent wash to signal "picked" without nuking the tint.
            bgLayers.push(
              "linear-gradient(135deg, rgb(var(--color-accent-rgb, 14 165 233) / 0.12), rgb(var(--color-accent-rgb, 14 165 233) / 0.06))",
            );
          }
          if (tint) {
            bgLayers.push(
              `linear-gradient(135deg, ${tint.from} 0%, ${tint.to} 100%)`,
            );
          }
          bgLayers.push("var(--color-surface)");

          return (
            <button
              key={lang.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && setSelected(lang.id)}
              style={{ background: bgLayers.join(", ") }}
              className={
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-150 " +
                stateClasses
              }
              aria-label={`Learn ${lang.name}${isAvailable ? "" : " (coming soon)"}`}
            >
              {/* Language name inset across the top of the card. */}
              <span
                className={
                  "absolute left-0 right-0 top-3 text-center text-sm font-semibold sm:text-base " +
                  (isSelected ? "text-accent" : "text-text-primary")
                }
              >
                {lang.name}
              </span>

              {/* Flag centered, ~60% of card. Noto Emoji wave-style flag
               *  SVG — device-agnostic. */}
              {flagSrc ? (
                <img
                  src={flagSrc}
                  alt=""
                  width={140}
                  height={140}
                  loading="eager"
                  className="h-[60%] w-[60%] max-h-36 max-w-36 select-none object-contain"
                  draggable={false}
                />
              ) : (
                <span aria-hidden className="text-7xl">
                  {lang.flag}
                </span>
              )}

              {/* "Soon" badge for unbuilt languages — sets honest
               *  expectations without removing them from the picker. */}
              {!isAvailable && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-text-muted/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
