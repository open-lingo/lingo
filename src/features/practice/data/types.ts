export type ParticleDef = {
  id: string;
  form: string;
  meaning: string;
  usage?: string;
};

/** Optional grouping for the particle practice UI (e.g. "Topic & subject", "Location"). */
export type ParticleSection = {
  id: string;
  name: string;
  particleIds: string[];
};

export type ParticlesData = {
  languageId: string;
  particles: ParticleDef[];
  /** When set, particles are shown in these sections. Otherwise one grid. */
  sections?: ParticleSection[];
};
