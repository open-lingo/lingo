import type { JourneyDiagramSpec } from "@/features/lesson/types";

/**
 * DEV · Candidate journey diagrams — the executable spec for the proposed
 * `journey:` field on a grammar point. Mirrors `JourneyDiagramSpec`; used by
 * the QA driver only, never by the compiler.
 *
 * m19 is the densest visual opportunity left in the course: it teaches に
 * (destination), へ (heading), で (means) and まで (as far as) in one module,
 * plus から (origin) which m16 introduced. Five particles, one picture.
 */

/** m19 L2/L3 — the module's whole particle inventory on a single journey. */
export const M19_JOURNEY: JourneyDiagramSpec & { id: string; title: string } = {
  kind: "journey",
    id: "m19-journey",
  title: "m19 — に / へ / で / から on one journey",
  traveller: { label: "わたし", color: "#f97316" },
  verb: "いく",
  origin: {
    label: "うち",
    particle: "から",
    note: "から marks where the journey STARTS. It is the same から you met for reasons — a noun in front means 'from', a clause in front means 'because'.",
  },
  means: {
    label: "でんしゃ",
    particle: "で",
    note: "で marks what you travel BY. It rides on you, not on the path — you are not acting on the train, you are using it, and で always means 'using this'.",
  },
  destination: {
    label: "えき",
    particle: "に",
    note: "に marks where you ARRIVE. The same に you already use for where a thing IS and for when something happens — a destination is a place you land on.",
  },
  destinationAlt: {
    particle: "へ",
    note: "へ marks the same slot, but points rather than lands: it is the heading, not the arrival. Written as the kana he, read as e — always, no exceptions. Swap it back and forth; almost nothing changes, and that is the point.",
  },
};

/** m19 L6 — まで is a LIMIT, not a destination: you stop there, you don't arrive. */
export const M19_MADE: JourneyDiagramSpec & { id: string; title: string } = {
  kind: "journey",
    id: "m19-made",
  title: "m19 — まで stops the journey short of a destination",
  traveller: { label: "わたし", color: "#f97316" },
  verb: "あるく",
  limit: {
    label: "えき",
    particle: "まで",
    note: "まで marks HOW FAR, not where you end up. 「えきまで あるく」 = I walk as far as the station — the walking stops there; it says nothing about arriving.",
  },
  destination: {
    label: "だいがく",
    particle: "に",
    note: "に is still the place you arrive at. まで and に can sit in the same sentence precisely because they are different roles: one bounds the movement, one names its target.",
  },
};

export const ALL_JOURNEYS = [M19_JOURNEY, M19_MADE];

/**
 * The SHIPPING m19 rule strings these would replace, copied from
 * `ir/m19.ir.yaml` on 2026-08-18. Verbatim, so the comparison is honest.
 */
export const M19_CURRENT_RULES = [
  {
    kind: "journey",
    id: "ni-location",
    chars: 0,
    text: "に marks the place you ARRIVE at. 「えきに いく」 = I'm going to the station. This is not a new particle — it is a third job for one you have had for a long time.",
  },
  {
    kind: "journey",
    id: "e-direction",
    chars: 0,
    text: "へ is the one genuinely new piece in this module, and the first thing to know about it is how it SOUNDS. Written, it is the hiragana he. Used as a PARTICLE it is read e — always, with no exceptions, and nothing else in the writing system does this.",
  },
  {
    kind: "journey",
    id: "de-action",
    chars: 0,
    text: "で has a second job and it is the one this module needs: で marks the MEANS — the thing you go BY. 「くるまで いく」 = I go by car. You met で as the place an action happens, and this is the same particle saying the same thing from another angle, because で always means 'using this'.",
  },
];
