/**
 * Production language picker — 2×2 (mobile) / 3-col (desktop) flag-grid.
 * Mirrors the word_image_mcq card pattern from the lesson player so the
 * visual language is consistent across the whole product.
 *
 * Composes into two surfaces:
 *   - First-launch modal (`LanguagePickerModal` wraps this).
 *   - Inline pre-signup picker on the landing page (`LandingPage` mounts
 *     this directly + a CTA that handoffs to Auth0 via sessionStorage).
 *
 * Props:
 *   - `onSelect(lang)` — called when a user picks an available language.
 *     Caller decides what to do (write to settings, trigger Auth0, etc.).
 *   - `selectedId` (optional) — for controlled mode (landing CTA preview).
 *   - `headline` / `subhead` — copy override per surface.
 *   - `showSoon` (default true) — render unbuilt languages dimmed with
 *     a "Soon" badge. Set false to only show available languages.
 *
 * Renders ALL configured languages by default (honesty-pass per audit):
 * available ones full-color and selectable, the rest dimmed with "Soon".
 */
import { LANGUAGE_CONFIGS } from "@/shared/domain/languageConfig";
import type { Language } from "@/shared/domain/languages";
import { notoFlagUrl } from "@/shared/assets/notoEmoji";
import { useVisibleLearningLanguageIds } from "@/shared/hooks/useVisibleLearningLanguageIds";

const FLAG_CODES: Record<string, string> = {
  ja: "JP",
  ko: "KR",
  zh: "CN",
  es: "ES",
  de: "DE",
  fr: "FR",
  en: "GB",
  // No "pt": "BR" entry — `src/pub/region-flags/svg/` doesn't vendor a
  // BR.svg (verified: only CN/DE/ES/FR/GB/JP/KR exist). Omitting the code
  // is the graceful path already built into this component: `flagSrc`
  // resolves to `null` and it falls back to `lang.flag` (🇧🇷, from
  // languageConfig.ts) — an emoji glyph, not a broken <img>. Add a vendored
  // BR.svg (see notoEmoji.ts's header for the source) and this entry
  // together, in the same commit, if the switch is ever wanted.
};

// Solid per-language card color, rendered as a light 135° diagonal gradient
// (country color, not the literal flag). Bumped from the old ~5–10% wash —
// which barely registered — to a present-but-soft fill so each card reads as
// a real color while the gradient keeps it gentle.
const LANG_TINT: Record<string, { from: string; to: string }> = {
  ja: { from: "rgba(220, 38, 38, 0.20)",  to: "rgba(248, 113, 113, 0.10)" },
  ko: { from: "rgba(37, 99, 235, 0.18)",  to: "rgba(220, 38, 38, 0.10)"  },
  zh: { from: "rgba(220, 38, 38, 0.18)",  to: "rgba(250, 204, 21, 0.12)" },
  es: { from: "rgba(234, 88, 12, 0.18)",  to: "rgba(250, 204, 21, 0.12)" },
  de: { from: "rgba(250, 204, 21, 0.22)", to: "rgba(180, 83, 9, 0.11)"   },
  fr: { from: "rgba(37, 99, 235, 0.18)",  to: "rgba(244, 114, 182, 0.11)"},
  en: { from: "rgba(30, 64, 175, 0.18)",  to: "rgba(220, 38, 38, 0.10)"  },
  pt: { from: "rgba(5, 150, 105, 0.20)",  to: "rgba(250, 204, 21, 0.12)" },
};

// Honest display order: shipped first (ja), then ko (limited stub),
// then the 5 unbuilt configs. `pt` is NOT listed here — it is a beta
// course (docs/pt-course-design-2026-09-18.md §5), appended below only
// for the signed-in user it is currently visible to (see
// useVisibleLearningLanguageIds's header — "absent", not a dimmed "Soon"
// card, is the correct render for everyone else).
const DISPLAY_ORDER = ["ja", "ko", "zh", "es", "de", "fr", "en"];

type Props = {
  onSelect: (lang: Language) => void;
  selectedId?: string | null;
  headline?: string;
  subhead?: string;
  showSoon?: boolean;
  /** Optional container className override (drop borders / padding when
   *  used inside a modal that already provides chrome). */
  className?: string;
};

export function LanguagePickerGrid({
  onSelect,
  selectedId,
  headline = "What do you want to learn?",
  subhead = "Pick a language to get started. You can switch later.",
  showSoon = true,
  className,
}: Props) {
  const visibleIds = useVisibleLearningLanguageIds();
  // `pt` only enters the rendered list at all when it is visible to the
  // current user (flag on + allow-listed) — everyone else must see it as
  // absent, not as a dimmed "Soon" card, per the lead's decision.
  const order = visibleIds.includes("pt")
    ? [...DISPLAY_ORDER, "pt"]
    : DISPLAY_ORDER;
  const langs = order
    .map((id) => LANGUAGE_CONFIGS[id])
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const available = new Set<string>(visibleIds);

  return (
    <div className={className ?? "rounded-card border border-border bg-surface p-6"}>
      {headline && (
        <h3 className="text-xl font-bold text-text-primary">{headline}</h3>
      )}
      {subhead && (
        <p className="mt-1 text-sm text-text-secondary">{subhead}</p>
      )}

      <div className="relative mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {langs
          .filter((l) => showSoon || available.has(l.id))
          .map((lang) => {
            const isAvailable = available.has(lang.id);
            const isSelected = selectedId === lang.id;
            const flagSrc = notoFlagUrl(FLAG_CODES[lang.id] ?? "");

            // Single selection signal — color shift only. Dropped the
            // shadow jump + ring-offset stack so the surface stops popping
            // forward + outward when a card is picked. Cleaner read.
            let stateClasses =
              "border-border hover:border-accent/40 active:translate-y-0";
            if (isSelected) {
              stateClasses = "border-accent";
            }
            if (!isAvailable) {
              stateClasses =
                "border-border opacity-55 cursor-not-allowed";
            }

            const tint = LANG_TINT[lang.id];
            const bgLayers: string[] = [];
            if (isSelected) {
              bgLayers.push(
                "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-accent)) 12%, transparent), color-mix(in srgb, rgb(var(--color-accent)) 6%, transparent))",
              );
            }
            if (tint) {
              bgLayers.push(
                `linear-gradient(135deg, ${tint.from} 0%, ${tint.to} 100%)`,
              );
            }
            bgLayers.push("rgb(var(--color-surface))");

            return (
              <button
                key={lang.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelect(lang)}
                style={{ background: bgLayers.join(", ") }}
                className={
                  "relative flex aspect-square flex-col items-center justify-center rounded-card border-2 p-4 transition-all duration-150 " +
                  stateClasses
                }
                aria-label={`Learn ${lang.name}${isAvailable ? "" : " (coming soon)"}`}
                aria-pressed={isSelected}
              >
                <span
                  className={
                    "absolute left-0 right-0 top-3 text-center text-sm font-semibold sm:text-base " +
                    (isSelected ? "text-accent" : "text-text-primary")
                  }
                >
                  {lang.name}
                </span>

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
