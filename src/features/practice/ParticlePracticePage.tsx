import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SegmentedControl } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import type { ParticleDef, ParticleSection, ParticlesData } from "@/features/practice/data/types";
import { useCourseLevel } from "./useCourseLevel";
import { minePairSentences } from "./particles/mineParticlePairs";
import { MIN_PAIR_SENTENCES, PARTICLE_PAIRS } from "./particles/particlePairs";

type ParticleMode = "reference" | "combine";

/**
 * Combine mode — the particle-PAIR drill picker (JA only: the miner walks the
 * JA taught corpus). Each chip shows how many taught sentences carry both
 * particles at the learner's level; a pair under `MIN_PAIR_SENTENCES` is shown
 * but not offered, with the count, so the learner can see it opening up.
 */
function CombinePanel() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const reachedModule = useCourseLevel();
  const pairs = useMemo(
    () =>
      PARTICLE_PAIRS.map((pair) => ({
        pair,
        count: minePairSentences(pair.particles, reachedModule).length,
      })),
    [reachedModule],
  );
  return (
    <section aria-labelledby="particle-combine-heading" className="space-y-3">
      <div>
        <h2 id="particle-combine-heading" className="text-lg font-semibold text-text-primary">
          {t("practice.particles.combine.heading", { defaultValue: "Train two particles together" })}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("practice.particles.combine.intro", {
            defaultValue:
              "Sentences you've already met, with both particles missing. Fill both blanks — the pair only makes sense together.",
          })}
        </p>
      </div>
      <ul className="grid list-none gap-3 sm:grid-cols-2" role="list">
        {pairs.map(({ pair, count }) => {
          const ready = count >= MIN_PAIR_SENTENCES;
          const inner = (
            <>
              <span className="flex items-center gap-1.5" lang="ja">
                {pair.particles.map((p, i) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-sm font-bold text-text-muted" aria-hidden>
                        +
                      </span>
                    )}
                    <span
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-lg font-bold leading-none ${
                        ready ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-surface-muted text-text-muted"
                      }`}
                    >
                      {p}
                    </span>
                  </span>
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">{pair.tagline}</span>
                <span className="block text-xs text-text-muted">
                  {ready
                    ? t("practice.particles.combine.sentenceCount", {
                        defaultValue: "{{count}} sentences",
                        count,
                      })
                    : t("practice.particles.combine.locked", {
                        defaultValue: "Opens up as you learn · {{count}}/{{min}} sentences",
                        count,
                        min: MIN_PAIR_SENTENCES,
                      })}
                </span>
              </span>
              {ready && <Icon name="chevronRight" size={18} className="shrink-0 text-text-muted" aria-hidden />}
            </>
          );
          const cls =
            "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition " +
            (ready
              ? "border-border bg-surface shadow-card hover:border-accent hover:shadow-popover"
              : "border-border-muted bg-surface-muted/60 opacity-70");
          return (
            <li key={pair.id}>
              {ready ? (
                <Link to={langPath(`practice/grammar/particles/combine?pair=${pair.id}`)} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls} aria-disabled>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Sections to display: data.sections if present, else one section containing all particles. */
function getParticleDisplaySections(data: ParticlesData): ParticleSection[] {
  if (data.sections?.length) return data.sections;
  return [
    {
      id: "all",
      name: "Particles",
      particleIds: data.particles.map((p) => p.id),
    },
  ];
}

function ParticleCard({
  particle,
  size = "default",
}: {
  particle: ParticleDef;
  size?: "compact" | "default";
}) {
  const isCompact = size === "compact";
  return (
    <div
      className={`flex min-w-0 flex-col rounded-lg border border-border bg-surface shadow-card transition hover:border-border-muted hover:shadow-popover ${
        isCompact
          ? "min-h-[2.25rem] min-w-[2.25rem] items-center justify-center whitespace-nowrap px-2.5 py-1.5 text-lg"
          : "min-h-[5rem] items-start justify-start gap-1 p-4 text-left"
      }`}
      role="listitem"
      aria-label={`${particle.form}: ${particle.meaning}`}
    >
      <span className={`font-medium text-text-primary ${!isCompact ? "text-2xl leading-tight" : ""}`}>
        {particle.form}
      </span>
      {!isCompact && (
        <>
          <span className="text-sm font-medium text-text-secondary">
            {particle.meaning}
          </span>
          {particle.usage && (
            <span className="text-xs leading-relaxed text-text-muted">
              {particle.usage}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function ParticleSectionBlock({
  section,
  particleMap,
  sectionLabel,
}: {
  section: ParticleSection;
  particleMap: Map<string, ParticleDef>;
  sectionLabel: string;
}) {
  const sectionParticles = useMemo(
    () =>
      section.particleIds
        .map((id) => particleMap.get(id))
        .filter((p): p is ParticleDef => p != null),
    [section.particleIds, particleMap]
  );
  if (!sectionParticles.length) return null;
  const sectionId = `particle-section-${section.id}`;
  return (
    <section
      aria-labelledby={sectionId}
      className="space-y-3"
    >
      <h2
        id={sectionId}
        className="text-lg font-semibold text-text-primary"
      >
        {sectionLabel}
      </h2>
      <ul
        className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label={`${sectionLabel} particles`}
      >
        {sectionParticles.map((particle) => (
          <li key={particle.id}>
            <ParticleCard particle={particle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ParticlePracticePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const config = language ? getLanguageConfig(language.id) : null;
  const particlesData = language ? getParticlesForLanguage(language.id) : null;
  const particles = particlesData?.particles ?? [];
  const particleMap = useMemo(
    () => new Map(particles.map((p) => [p.id, p])),
    [particles]
  );
  const displaySections = useMemo(
    () => (particlesData ? getParticleDisplaySections(particlesData) : []),
    [particlesData]
  );
  const languageName = config?.name ?? language?.id ?? "";

  // Combine mode is JA-only (the pair miner walks the JA taught corpus). The
  // mode lives in the URL so the drill's back link lands on the picker, not
  // the reference list.
  const [params, setParams] = useSearchParams();
  const combineAvailable = language?.id === "ja";
  const mode: ParticleMode = combineAvailable && params.get("mode") === "combine" ? "combine" : "reference";
  const setMode = (next: ParticleMode) => {
    const nextParams = new URLSearchParams(params);
    if (next === "combine") nextParams.set("mode", "combine");
    else nextParams.delete("mode");
    setParams(nextParams, { replace: true });
  };

  if (!language) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.particles.title")}
        </h1>
        <p className="mt-2 text-text-secondary">
          {t("practice.particles.noLanguage")}
        </p>
      </div>
    );
  }

  if (!particlesData || particles.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.particles.title")}
        </h1>
        <p className="mt-2 text-text-secondary">
          {t("practice.particles.noData", { language: languageName })}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.particles.title")}
        </h1>
        <p className="mt-1 text-text-secondary">
          {t("practice.particles.subtitle", { language: languageName })}
        </p>
        {combineAvailable && (
          <SegmentedControl
            className="mt-4"
            fullWidth
            ariaLabel={t("practice.particles.modeAria", { defaultValue: "Particle practice mode" })}
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "reference",
                label: t("practice.particles.modeReference", { defaultValue: "Reference" }),
                leading: <Icon name="bookOpen" size={14} aria-hidden />,
              },
              {
                value: "combine",
                label: t("practice.particles.modeCombine", { defaultValue: "Combine" }),
                leading: <Icon name="layers" size={14} aria-hidden />,
              },
            ]}
          />
        )}
      </header>

      {mode === "combine" ? (
        <CombinePanel />
      ) : displaySections.length === 0 ? (
        <p className="text-text-secondary">
          {t("practice.particles.noSections")}
        </p>
      ) : (
        <>
          {particles.length > 0 && (
            <section
              className="mb-8"
              aria-labelledby="particles-overview-heading"
            >
              <h2
                id="particles-overview-heading"
                className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted"
              >
                {t("practice.particles.allParticles")}
              </h2>
              <ul
                className="flex flex-wrap gap-1.5"
                role="list"
                aria-label="All particles"
              >
                {particles.map((particle) => (
                  <li key={particle.id}>
                    <ParticleCard particle={particle} size="compact" />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-col gap-10">
            {displaySections.map((section) => (
              <ParticleSectionBlock
                key={section.id}
                section={section}
                particleMap={particleMap}
                sectionLabel={t(`practice.particles.sections.${section.id}`, { defaultValue: section.name })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
