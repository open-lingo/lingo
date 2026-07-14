/**
 * Spanish conjugation tables — A1 course seed.
 *
 * Mirrors `ko/conjugationTables.ts` structurally (entry shape, labels map,
 * `getVerbByAtomId`) with Spanish's own axes: person × tense instead of
 * politeness × tense. Ten seed verbs per the course spine
 * (docs/es-course-spine-2026-07-13.md §Conjugation tables), each with the
 * full presente + pretérito + imperfecto paradigms (18 cells).
 *
 * `vosotros` is included in the DATA for completeness but flagged in the
 * labels as Spain-only — the LatAm-neutral course drills `ustedes` (which
 * shares the él/ella third-person-plural form). Preterite/imperfect rows
 * are TRAINER data (A2 preview): the A1 course itself drills present only.
 */
import type { AtomId } from "@/shared/language/types";

export type EsVerbForm =
  // Presente
  | "present.yo"
  | "present.tu"
  | "present.el"
  | "present.nosotros"
  | "present.vosotros"
  | "present.ustedes"
  // Pretérito (indefinido)
  | "preterite.yo"
  | "preterite.tu"
  | "preterite.el"
  | "preterite.nosotros"
  | "preterite.vosotros"
  | "preterite.ustedes"
  // Imperfecto
  | "imperfect.yo"
  | "imperfect.tu"
  | "imperfect.el"
  | "imperfect.nosotros"
  | "imperfect.vosotros"
  | "imperfect.ustedes";

export type EsVerbEntry = {
  id: string;
  lemma: string;
  meaning: string;
  /** Conjugation class — drives auto-generation rules in a future pass. */
  group: "ar" | "er" | "ir" | "irregular";
  forms: Record<EsVerbForm, string>;
  introducedAtModule: number;
};

export const ES_VERB_ENTRIES: EsVerbEntry[] = [
  {
    id: "hablar",
    lemma: "hablar",
    meaning: "to speak",
    group: "ar",
    introducedAtModule: 8, // M8 Rutinas I — the -ar paradigm module
    forms: {
      "present.yo": "hablo",
      "present.tu": "hablas",
      "present.el": "habla",
      "present.nosotros": "hablamos",
      "present.vosotros": "habláis",
      "present.ustedes": "hablan",
      "preterite.yo": "hablé",
      "preterite.tu": "hablaste",
      "preterite.el": "habló",
      "preterite.nosotros": "hablamos",
      "preterite.vosotros": "hablasteis",
      "preterite.ustedes": "hablaron",
      "imperfect.yo": "hablaba",
      "imperfect.tu": "hablabas",
      "imperfect.el": "hablaba",
      "imperfect.nosotros": "hablábamos",
      "imperfect.vosotros": "hablabais",
      "imperfect.ustedes": "hablaban",
    },
  },
  {
    id: "comer",
    lemma: "comer",
    meaning: "to eat",
    group: "er",
    introducedAtModule: 9, // M9 Rutinas II — the -er/-ir paradigm module
    forms: {
      "present.yo": "como",
      "present.tu": "comes",
      "present.el": "come",
      "present.nosotros": "comemos",
      "present.vosotros": "coméis",
      "present.ustedes": "comen",
      "preterite.yo": "comí",
      "preterite.tu": "comiste",
      "preterite.el": "comió",
      "preterite.nosotros": "comimos",
      "preterite.vosotros": "comisteis",
      "preterite.ustedes": "comieron",
      "imperfect.yo": "comía",
      "imperfect.tu": "comías",
      "imperfect.el": "comía",
      "imperfect.nosotros": "comíamos",
      "imperfect.vosotros": "comíais",
      "imperfect.ustedes": "comían",
    },
  },
  {
    id: "vivir",
    lemma: "vivir",
    meaning: "to live",
    group: "ir",
    introducedAtModule: 9,
    forms: {
      "present.yo": "vivo",
      "present.tu": "vives",
      "present.el": "vive",
      "present.nosotros": "vivimos",
      "present.vosotros": "vivís",
      "present.ustedes": "viven",
      "preterite.yo": "viví",
      "preterite.tu": "viviste",
      "preterite.el": "vivió",
      "preterite.nosotros": "vivimos",
      "preterite.vosotros": "vivisteis",
      "preterite.ustedes": "vivieron",
      "imperfect.yo": "vivía",
      "imperfect.tu": "vivías",
      "imperfect.el": "vivía",
      "imperfect.nosotros": "vivíamos",
      "imperfect.vosotros": "vivíais",
      "imperfect.ustedes": "vivían",
    },
  },
  {
    id: "ser",
    lemma: "ser",
    meaning: "to be (identity)",
    group: "irregular",
    introducedAtModule: 2, // M2 Presentaciones — soy/eres/es
    forms: {
      "present.yo": "soy",
      "present.tu": "eres",
      "present.el": "es",
      "present.nosotros": "somos",
      "present.vosotros": "sois",
      "present.ustedes": "son",
      "preterite.yo": "fui",
      "preterite.tu": "fuiste",
      "preterite.el": "fue",
      "preterite.nosotros": "fuimos",
      "preterite.vosotros": "fuisteis",
      "preterite.ustedes": "fueron",
      "imperfect.yo": "era",
      "imperfect.tu": "eras",
      "imperfect.el": "era",
      "imperfect.nosotros": "éramos",
      "imperfect.vosotros": "erais",
      "imperfect.ustedes": "eran",
    },
  },
  {
    id: "estar",
    lemma: "estar",
    meaning: "to be (location / state)",
    group: "irregular",
    introducedAtModule: 7, // M7 Estar y lugares
    forms: {
      "present.yo": "estoy",
      "present.tu": "estás",
      "present.el": "está",
      "present.nosotros": "estamos",
      "present.vosotros": "estáis",
      "present.ustedes": "están",
      "preterite.yo": "estuve",
      "preterite.tu": "estuviste",
      "preterite.el": "estuvo",
      "preterite.nosotros": "estuvimos",
      "preterite.vosotros": "estuvisteis",
      "preterite.ustedes": "estuvieron",
      "imperfect.yo": "estaba",
      "imperfect.tu": "estabas",
      "imperfect.el": "estaba",
      "imperfect.nosotros": "estábamos",
      "imperfect.vosotros": "estabais",
      "imperfect.ustedes": "estaban",
    },
  },
  {
    id: "ir",
    lemma: "ir",
    meaning: "to go",
    group: "irregular",
    introducedAtModule: 11, // M11 Vamos
    // Preterite is identical to ser's (fui/fuiste/fue…) — a real Spanish
    // fact, not a copy-paste error.
    forms: {
      "present.yo": "voy",
      "present.tu": "vas",
      "present.el": "va",
      "present.nosotros": "vamos",
      "present.vosotros": "vais",
      "present.ustedes": "van",
      "preterite.yo": "fui",
      "preterite.tu": "fuiste",
      "preterite.el": "fue",
      "preterite.nosotros": "fuimos",
      "preterite.vosotros": "fuisteis",
      "preterite.ustedes": "fueron",
      "imperfect.yo": "iba",
      "imperfect.tu": "ibas",
      "imperfect.el": "iba",
      "imperfect.nosotros": "íbamos",
      "imperfect.vosotros": "ibais",
      "imperfect.ustedes": "iban",
    },
  },
  {
    id: "tener",
    lemma: "tener",
    meaning: "to have",
    group: "irregular",
    introducedAtModule: 5, // M5 Familia y posesión — tengo/tienes/tiene
    forms: {
      "present.yo": "tengo",
      "present.tu": "tienes",
      "present.el": "tiene",
      "present.nosotros": "tenemos",
      "present.vosotros": "tenéis",
      "present.ustedes": "tienen",
      "preterite.yo": "tuve",
      "preterite.tu": "tuviste",
      "preterite.el": "tuvo",
      "preterite.nosotros": "tuvimos",
      "preterite.vosotros": "tuvisteis",
      "preterite.ustedes": "tuvieron",
      "imperfect.yo": "tenía",
      "imperfect.tu": "tenías",
      "imperfect.el": "tenía",
      "imperfect.nosotros": "teníamos",
      "imperfect.vosotros": "teníais",
      "imperfect.ustedes": "tenían",
    },
  },
  {
    id: "querer",
    lemma: "querer",
    meaning: "to want / to love",
    group: "irregular",
    introducedAtModule: 10, // M10 Comida y gustos — quiero + noun/inf
    forms: {
      "present.yo": "quiero",
      "present.tu": "quieres",
      "present.el": "quiere",
      "present.nosotros": "queremos",
      "present.vosotros": "queréis",
      "present.ustedes": "quieren",
      "preterite.yo": "quise",
      "preterite.tu": "quisiste",
      "preterite.el": "quiso",
      "preterite.nosotros": "quisimos",
      "preterite.vosotros": "quisisteis",
      "preterite.ustedes": "quisieron",
      "imperfect.yo": "quería",
      "imperfect.tu": "querías",
      "imperfect.el": "quería",
      "imperfect.nosotros": "queríamos",
      "imperfect.vosotros": "queríais",
      "imperfect.ustedes": "querían",
    },
  },
  {
    id: "poder",
    lemma: "poder",
    meaning: "to be able to",
    group: "irregular",
    introducedAtModule: 13, // M13 Cambios de raíz — o→ue
    forms: {
      "present.yo": "puedo",
      "present.tu": "puedes",
      "present.el": "puede",
      "present.nosotros": "podemos",
      "present.vosotros": "podéis",
      "present.ustedes": "pueden",
      "preterite.yo": "pude",
      "preterite.tu": "pudiste",
      "preterite.el": "pudo",
      "preterite.nosotros": "pudimos",
      "preterite.vosotros": "pudisteis",
      "preterite.ustedes": "pudieron",
      "imperfect.yo": "podía",
      "imperfect.tu": "podías",
      "imperfect.el": "podía",
      "imperfect.nosotros": "podíamos",
      "imperfect.vosotros": "podíais",
      "imperfect.ustedes": "podían",
    },
  },
  {
    id: "hacer",
    lemma: "hacer",
    meaning: "to do / to make",
    group: "irregular",
    introducedAtModule: 16, // M16 De viaje — yo-irregular hago
    forms: {
      "present.yo": "hago",
      "present.tu": "haces",
      "present.el": "hace",
      "present.nosotros": "hacemos",
      "present.vosotros": "hacéis",
      "present.ustedes": "hacen",
      "preterite.yo": "hice",
      "preterite.tu": "hiciste",
      "preterite.el": "hizo",
      "preterite.nosotros": "hicimos",
      "preterite.vosotros": "hicisteis",
      "preterite.ustedes": "hicieron",
      "imperfect.yo": "hacía",
      "imperfect.tu": "hacías",
      "imperfect.el": "hacía",
      "imperfect.nosotros": "hacíamos",
      "imperfect.vosotros": "hacíais",
      "imperfect.ustedes": "hacían",
    },
  },
];

/** Lookup helper for the shared conjugation engine. */
export function getVerbByAtomId(atomId: AtomId): EsVerbEntry | undefined {
  return ES_VERB_ENTRIES.find(
    (v) => (`es:${v.lemma}` as AtomId) === atomId,
  );
}

export const ES_CONJUGATION_FORM_LABELS: Record<EsVerbForm, string> = {
  "present.yo": "yo (present)",
  "present.tu": "tú (present)",
  "present.el": "él / ella / usted (present)",
  "present.nosotros": "nosotros (present)",
  "present.vosotros": "vosotros (present — Spain)",
  "present.ustedes": "ustedes / ellos (present)",
  "preterite.yo": "yo (preterite)",
  "preterite.tu": "tú (preterite)",
  "preterite.el": "él / ella / usted (preterite)",
  "preterite.nosotros": "nosotros (preterite)",
  "preterite.vosotros": "vosotros (preterite — Spain)",
  "preterite.ustedes": "ustedes / ellos (preterite)",
  "imperfect.yo": "yo (imperfect)",
  "imperfect.tu": "tú (imperfect)",
  "imperfect.el": "él / ella / usted (imperfect)",
  "imperfect.nosotros": "nosotros (imperfect)",
  "imperfect.vosotros": "vosotros (imperfect — Spain)",
  "imperfect.ustedes": "ustedes / ellos (imperfect)",
};
