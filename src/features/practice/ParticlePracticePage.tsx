import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import type { ParticleDef, ParticleSection, ParticlesData } from "@/features/practice/data/types";

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
      className={`flex flex-col rounded-lg border border-border bg-surface shadow-card transition hover:border-border-muted hover:shadow-popover ${
        isCompact
          ? "min-h-[2.25rem] min-w-[2.25rem] items-center justify-center px-2 py-1.5 text-lg"
          : "min-h-[5rem] items-start justify-center p-4 text-left"
      }`}
      role="listitem"
      aria-label={`${particle.form}: ${particle.meaning}`}
    >
      <span className={`font-medium text-text-primary ${!isCompact ? "text-2xl" : ""}`}>
        {particle.form}
      </span>
      {!isCompact && (
        <>
          <span className="mt-1 text-sm text-text-secondary">
            {particle.meaning}
          </span>
          {particle.usage && (
            <span className="mt-1 text-xs text-text-muted">
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
      </header>

      {displaySections.length === 0 ? (
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
