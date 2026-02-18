export type ParticleDef = {
  id: string;
  form: string;
  meaning: string;
  usage?: string;
};

export type ParticlesData = {
  languageId: string;
  particles: ParticleDef[];
};
