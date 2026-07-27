/**
 * REGISTER AUDIENCES — the cast, addressed by ROLE rather than by name.
 *
 * Spencer 2026-07-27: "'grandma' character or 'teacher' character opposed to
 * names so they are exposed to the registers better."
 *
 * The point is that a role label IS the register cue. A chip reading 「たなか」
 * requires the learner to remember Tanaka is a teacher; a chip reading
 * 「せんせい」 makes the required register readable straight off the screen.
 * `DialogueListenLine.speaker` was designed for exactly this — its own doc
 * says "Stranger" / "You" / "Server" — we had simply been putting names in it
 * (83 lines across m6-m10, たなか by name 26×).
 *
 * The learner's OWN character keeps a name (トム); only the interlocutor is
 * role-labelled. That asymmetry is deliberate and matches Tobira, the one
 * textbook whose register instruction actually works: Ai keeps her name, and
 * everyone around her is labelled by relationship.
 *
 * SCOPE: this table exists to teach the politeness register and nothing else.
 * It is consumed only by `kind: register` beats. Do not reach for it to
 * decorate an ordinary teaching lesson.
 */

/** 1 = くだけた (plain) · 2 = 丁寧 (です・ます) · 3 = とても丁寧. */
export type PolitenessLevel = 1 | 2 | 3;

export type RegisterAudience = {
  /** Stable key used by IR beats. */
  id: string;
  /** Drawn cue — this is what replaces the English scenario line. */
  emoji: string;
  /** Accessible name. NEVER rendered as visible prose (that would put the
   *  narration back). */
  label: string;
  /** Japanese role label for dialogue speaker chips + vocative frames. */
  ja: string;
  politeness: PolitenessLevel;
};

export const REGISTER_AUDIENCES: Readonly<Record<string, RegisterAudience>> = {
  friend: {
    id: "friend",
    emoji: "👫",
    label: "a friend",
    ja: "ともだち",
    politeness: 1,
  },
  teacher: {
    id: "teacher",
    emoji: "🧑‍🏫",
    label: "your teacher",
    ja: "せんせい",
    politeness: 2,
  },
  // The grandmother is the audience Spencer named first, and she earns her
  // place: she is the clearest level-3 the learner can picture without any
  // workplace vocabulary.
  grandmother: {
    id: "grandmother",
    emoji: "👵",
    label: "an elderly neighbour",
    ja: "おばあさん",
    politeness: 3,
  },
  // m9's shop lessons already need a clerk — the natural keigo-down /
  // polite-up pair, free from content that exists.
  clerk: {
    id: "clerk",
    emoji: "🧑‍💼",
    label: "a shop clerk",
    ja: "てんいん",
    politeness: 3,
  },
};

export function audience(id: string): RegisterAudience | undefined {
  return REGISTER_AUDIENCES[id];
}

/**
 * The stage-1 cheat sheet, built from the audience table so the cline and the
 * cards can never disagree.
 *
 * `excludeAudienceId` implements TransformRuleTable's `maskBase` discipline —
 * the sheet must not name the very audience the card is asking about, or the
 * step is a lookup rather than a recall. Note the honest limit: register has
 * three levels and three words, so the sheet always CONTAINS the answer form.
 * What stage 1 actually trains is placing a person on the cline, not
 * recalling the word.
 */
export function registerCheatSheet(
  forms: Record<PolitenessLevel, string>,
  excludeAudienceId?: string,
): { label: string; rows: { cue: string; form: string }[] } {
  const rows = Object.values(REGISTER_AUDIENCES)
    .filter((a) => a.id !== excludeAudienceId)
    .filter(
      (a, i, arr) => arr.findIndex((b) => b.politeness === a.politeness) === i,
    )
    .sort((a, b) => a.politeness - b.politeness)
    .map((a) => ({ cue: `${a.emoji} ${a.label}`, form: forms[a.politeness] }));
  return { label: "how polite?", rows };
}
