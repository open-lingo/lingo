/**
 * French conjugation tables — Conjugation Trainer seed, m1–m15 verb set.
 *
 * Mirrors `es/conjugationTables.ts` structurally (entry shape, labels map,
 * `getVerbByAtomId`) so `gridConfig.ts` / `gridSession.ts` / the grid UI need
 * no new props to drive FR — only the AXES differ, not the shape:
 *   - ES: 6 persons (yo/tú/él/nosotros/vosotros/ustedes) × 3 tenses.
 *   - FR: 3 persons (je/tu/il) × 2 tenses (présent, passé composé). The
 *     il-bucket stands for il/elle/on collectively — they share one verb
 *     form for every cell in this file, exactly like ES's él/ella/usted
 *     bucket. nous/vous/ils are NOT taught anywhere in m1–m15 (no plural
 *     conjugated forms exist in the curriculum at all) and are out of scope
 *     for this seed, same reasoning ES used to defer vosotros drilling.
 *
 * VERB LIST + INTRODUCED-MODULE, derived by grepping
 * `fr/curriculum/m1.ts`…`m15.ts` for `atom({ … partOfSpeech: "verb" | "phrase" … })`
 * calls and correct-answer/audioText occurrences (2026-09-10):
 *   être (m2, irregular) · avoir (m7, irregular) · aimer (m3/m11, -er) ·
 *   parler (m11 présent / m14 passé composé, -er) · habiter (m11, -er) ·
 *   visiter (m15, -er) · manger (m14, -er).
 *
 * ─── WHICH CELLS ARE TAUGHT vs. TRAINER-PREVIEW (per the task's explicit
 * "state which in the file header" instruction) ───────────────────────────
 *
 * Unlike ES (where an entire TENSE is preview-only — presente is drilled,
 * pretérito/imperfecto are not), FR's taught/untaught split happens PER
 * CELL within a tense, because the course teaches the il/elle/on-generalizes
 * pattern before every verb has all three persons attested, and because
 * `visiter`/`manger` are taught asymmetrically (visiter: tu/il présent
 * taught, je présent is a WRONG-ANSWER-ONLY distractor everywhere it
 * appears — grep confirms "je visite" occurs 5× and every occurrence is a
 * `wrong-*`/`distractorsText` slot, never `correctText`/a taught surface;
 * manger: no présent form is taught at all, only passé composé). Each
 * entry below carries a `taughtForms: FrVerbForm[]` array so a consumer
 * (or a future gate) can tell "the course drilled this" from "the trainer
 * fills in the rest of the paradigm as an A1 preview" without re-deriving
 * it from prose. Ground truth per verb (grep evidence, `fr/curriculum/`):
 *
 *   être     — present.je/tu/il TAUGHT (m2: suis/es/est). passé composé
 *              UNTAUGHT (no "été" participle atom exists anywhere) — preview.
 *   avoir    — present.je/tu/il TAUGHT (m7: j'ai/tu as; m14: bare "a").
 *              passé composé UNTAUGHT (no "eu" participle) — preview.
 *   aimer    — present.je/tu/il TAUGHT (m3: j'aime/tu aimes; m11: bare
 *              "aime" + il/elle/on function words — "il aime"/"elle aime"/
 *              "on aime" all attested as taught surfaces). passé composé
 *              UNTAUGHT (no "aimé" participle atom registered) — preview.
 *   parler   — present.je/tu/il TAUGHT (m11). passé composé ALL THREE
 *              TAUGHT: je ("j'ai parlé" — correctText, m14 L9) and tu
 *              ("tu as parlé") are literal taught surfaces; the il-bucket
 *              is taught by the course's OWN STATED generalization — m14
 *              registers the bare aux atom "a" with gloss "the auxiliary
 *              for il/elle/on" and an explicit reveal note "«a» works with
 *              any name, not just il/elle" (m14.ts:669) — plus "elle a
 *              parlé" is directly attested. "il a parlé"/"on a parlé" do
 *              not appear as literal strings, but the course teaches the
 *              rule, not the string, for this cell — same status as ES
 *              teaching a whole paradigm from a stated conjugation pattern.
 *   habiter  — present.tu/il TAUGHT (m11: bare "habite"/"habites" +
 *              il/elle/on words). present.je: no atom is registered for
 *              "j'habite" (m11's own header explains why — see m11.ts:18-31,
 *              apostrophe-tokenization risk — the module deliberately keeps
 *              habiter's je-form OUT of the atom graph), but "j'habite" DOES
 *              appear as a correct, taught surface (pre-elided whole tile,
 *              `correctText`/dialogue answer at m11.ts:964,1009,1048,1108) —
 *              taught-by-surface, not taught-by-atom; counted TAUGHT here.
 *              passé composé UNTAUGHT (no "habité" participle) — preview.
 *   visiter  — present.tu/il TAUGHT (m15: "tu visites" audioText,
 *              "il visite" correctText). present.je UNTAUGHT — "je visite"
 *              is registered as a vocab atom but every one of its 5
 *              occurrences in m15 is a wrong-answer/distractor slot, never
 *              a taught/correct surface — preview only. passé composé ALL
 *              THREE TAUGHT (je/tu/il-bucket all directly attested as
 *              correct surfaces, incl. "il a visité"/"elle a visité"/
 *              "on a visité" literally, not just by generalization).
 *   manger   — present ALL THREE UNTAUGHT — no "mange"/"manges" atom is
 *              ever registered; every présent occurrence in the curriculum
 *              ("je mange", "il mange") is a wrong-tense distractor —
 *              preview only. passé composé ALL THREE TAUGHT (m14: "j'ai
 *              mangé" debuts L1; "tu as mangé"; il-bucket taught the same
 *              way as parler's — "il a mangé" AND "elle a mangé" both
 *              directly attested as correct surfaces here, stronger than
 *              parler's evidence).
 *
 * CELL-VALUE CONVENTION: passé composé cells store the PRONOUN-STRIPPED
 * aux+participle ("ai mangé", "as mangé", "a mangé"), never the fused
 * "j'ai mangé" surface the course actually prints. This matches the grid
 * UI's existing contract (ES's cells never embed the subject either — the
 * person column carries that) even though French elides the pronoun onto
 * the verb in a way Spanish never does; the grid always renders the person
 * label separately from the cell value, so storing the fused chunk would
 * make FR cells inconsistent with every other language's paradigm cell.
 *
 * `nous`/`vous`/`ils` are omitted entirely (not "untaught cells" — there is
 * no French grid person for them at all): the ES grid's shape is 6 persons
 * because Spanish's course-independent A1 trainer commits to the full
 * paradigm; French's shape is 3 because that is what "mirror its shape
 * exactly" resolves to once the actual taught pronoun set (je/tu/il-elle-on)
 * is the ceiling — adding untaught plural columns would be pure invention,
 * not a trainer preview of anything the course teaches or plans to teach
 * in the m1–m15 window this file covers.
 */
import type { AtomId } from "@/shared/language/types";

export type FrVerbForm =
  // Présent
  | "present.je"
  | "present.tu"
  | "present.il"
  // Passé composé (avoir-only; no être-auxiliary verb is taught through m15)
  | "passeCompose.je"
  | "passeCompose.tu"
  | "passeCompose.il";

export type FrVerbEntry = {
  id: string;
  lemma: string;
  meaning: string;
  /** Conjugation class. FR's -er paradigm dominates the taught set; être/
   *  avoir are the only irregulars through m15. */
  group: "er" | "irregular";
  forms: Record<FrVerbForm, string>;
  introducedAtModule: number;
  /** Cells the course has actually drilled as taught/correct surfaces (see
   *  file header for the grep evidence per verb) — the rest of `forms` is
   *  filled in as trainer preview, same spirit as ES's untaught tenses. */
  taughtForms: FrVerbForm[];
};

export const FR_VERB_ENTRIES: FrVerbEntry[] = [
  {
    id: "etre",
    lemma: "être",
    meaning: "to be",
    group: "irregular",
    introducedAtModule: 2, // M2 — suis/es/est
    forms: {
      "present.je": "suis",
      "present.tu": "es",
      "present.il": "est",
      "passeCompose.je": "ai été",
      "passeCompose.tu": "as été",
      "passeCompose.il": "a été",
    },
    taughtForms: ["present.je", "present.tu", "present.il"],
  },
  {
    id: "avoir",
    lemma: "avoir",
    meaning: "to have",
    group: "irregular",
    introducedAtModule: 7, // M7 — j'ai / tu as; il-form "a" debuts m14
    forms: {
      "present.je": "ai",
      "present.tu": "as",
      "present.il": "a",
      "passeCompose.je": "ai eu",
      "passeCompose.tu": "as eu",
      "passeCompose.il": "a eu",
    },
    taughtForms: ["present.je", "present.tu", "present.il"],
  },
  {
    id: "aimer",
    lemma: "aimer",
    meaning: "to like / to love",
    group: "er",
    introducedAtModule: 3, // M3 — j'aime / tu aimes; il/elle/on at m11
    forms: {
      "present.je": "aime",
      "present.tu": "aimes",
      "present.il": "aime",
      "passeCompose.je": "ai aimé",
      "passeCompose.tu": "as aimé",
      "passeCompose.il": "a aimé",
    },
    taughtForms: ["present.je", "present.tu", "present.il"],
  },
  {
    id: "parler",
    lemma: "parler",
    meaning: "to speak",
    group: "er",
    introducedAtModule: 11, // M11 présent; passé composé at m14
    forms: {
      "present.je": "parle",
      "present.tu": "parles",
      "present.il": "parle",
      "passeCompose.je": "ai parlé",
      "passeCompose.tu": "as parlé",
      "passeCompose.il": "a parlé",
    },
    taughtForms: [
      "present.je",
      "present.tu",
      "present.il",
      "passeCompose.je",
      "passeCompose.tu",
      "passeCompose.il",
    ],
  },
  {
    id: "habiter",
    lemma: "habiter",
    meaning: "to live (reside)",
    group: "er",
    introducedAtModule: 11, // M11 — tu habites / il habite; j'habite as a whole tile
    forms: {
      "present.je": "habite",
      "present.tu": "habites",
      "present.il": "habite",
      "passeCompose.je": "ai habité",
      "passeCompose.tu": "as habité",
      "passeCompose.il": "a habité",
    },
    taughtForms: ["present.je", "present.tu", "present.il"],
  },
  {
    id: "visiter",
    lemma: "visiter",
    meaning: "to visit",
    group: "er",
    introducedAtModule: 15, // M15 — présent tu/il + full passé composé
    forms: {
      "present.je": "visite",
      "present.tu": "visites",
      "present.il": "visite",
      "passeCompose.je": "ai visité",
      "passeCompose.tu": "as visité",
      "passeCompose.il": "a visité",
    },
    // present.je ("je visite") is registered but only ever appears as a
    // wrong-answer distractor in m15 — NOT taught.
    taughtForms: ["present.tu", "present.il", "passeCompose.je", "passeCompose.tu", "passeCompose.il"],
  },
  {
    id: "manger",
    lemma: "manger",
    meaning: "to eat",
    group: "er",
    introducedAtModule: 14, // M14 — passé composé only; présent never taught
    forms: {
      "present.je": "mange",
      "present.tu": "manges",
      "present.il": "mange",
      "passeCompose.je": "ai mangé",
      "passeCompose.tu": "as mangé",
      "passeCompose.il": "a mangé",
    },
    taughtForms: ["passeCompose.je", "passeCompose.tu", "passeCompose.il"],
  },
];

/** Lookup helper for the shared conjugation engine. Mirrors
 *  `es/conjugationTables.ts#getVerbByAtomId` — the `fr:<lemma>` id is a
 *  conventional lemma key (same convention ES uses), not a claim that an
 *  `atom({ surface: lemma })` call exists for every verb (several FR
 *  infinitives, e.g. «avoir»/«être», are never registered as their own
 *  atom — only their conjugated forms are). */
export function getVerbByAtomId(atomId: AtomId): FrVerbEntry | undefined {
  return FR_VERB_ENTRIES.find((v) => (`fr:${v.lemma}` as AtomId) === atomId);
}

export const FR_CONJUGATION_FORM_LABELS: Record<FrVerbForm, string> = {
  "present.je": "je (présent)",
  "present.tu": "tu (présent)",
  "present.il": "il / elle / on (présent)",
  "passeCompose.je": "je (passé composé)",
  "passeCompose.tu": "tu as (passé composé)",
  "passeCompose.il": "il / elle / on (passé composé)",
};
