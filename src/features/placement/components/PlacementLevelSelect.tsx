import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { PlacementLevelBand } from "../levelBands";

type Props = {
  /** Display name of the language being placed (e.g. "Japanese"). */
  languageName: string;
  bands: readonly PlacementLevelBand[];
  onSelect: (band: PlacementLevelBand) => void;
  onExit: () => void;
};

/**
 * Step 0 of placement (2026-07-15): the learner self-declares their level. The
 * choice bounds BOTH the sampling range and the credit ceiling — a "complete
 * beginner" pick samples nothing and starts at M1, other bands sample ~2
 * modules inside the band. Shown for onboarding AND retake.
 */
export function PlacementLevelSelect({
  languageName,
  bands,
  onSelect,
  onExit,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onExit}
          className="ml-2 rounded-xl p-2.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("placement.exit", { defaultValue: "Exit placement test" })}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.25}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Icon name="sparkles" size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("placement.levelSelectTitle", {
              defaultValue: "How much {{language}} do you already know?",
              language: languageName,
            })}
          </h1>
          <p className="max-w-md text-sm text-text-secondary">
            {t("placement.levelSelectBody", {
              defaultValue:
                "Pick the closest level. We'll check a few questions to place you — you'll never skip past what you actually know.",
            })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {bands.map((band) => (
            <button
              key={band.id}
              type="button"
              onClick={() => onSelect(band)}
              className="group flex w-full items-center justify-between gap-4 rounded-card border border-border bg-surface-elevated p-4 text-left transition hover:border-accent hover:bg-surface-muted active:scale-[0.99]"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold text-text-primary">
                  {band.label}
                </span>
                <span className="text-sm text-text-secondary">
                  {band.description}
                </span>
              </span>
              <Icon
                name="chevronRight"
                size={20}
                className="shrink-0 text-text-muted transition group-hover:text-accent"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
