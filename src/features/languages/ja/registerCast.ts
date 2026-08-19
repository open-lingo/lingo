import type { CastRole, RegisterAudienceView } from "@/features/lesson/types";
import { REGISTER_AUDIENCES } from "./registerAudiences";
import { castBowPortraitUrl, castPortraitUrl } from "./castPortraits";

/**
 * The register cast as a SCENE reads it — one place, so the QA page and the
 * shipped lesson cannot disagree about who せんせい is.
 *
 * `registerAudiences.ts` owns the pedagogy (who the roles are, and why they are
 * roles rather than names). `castPortraits.ts` owns the art. This file is the
 * join, and it exists because an IR scene must be able to say `cast: [friend,
 * teacher]` and get a face — authoring a portrait path into YAML would fork
 * the cast the first time a portrait is regenerated.
 */

/** Colours match the transfer and journey scenes, so a role reads the same
 *  everywhere in the course. They tint the chip and the drawn fallback only;
 *  the generated portraits carry their own palette. */
const COLORS: Readonly<Record<string, string>> = {
  friend: "#14b8a6",
  teacher: "#8b5cf6",
  grandmother: "#f472b6",
  clerk: "#38bdf8",
};

const ROLES: Readonly<Record<string, CastRole>> = {
  friend: "friend",
  teacher: "teacher",
  grandmother: "grandmother",
  clerk: "clerk",
};

/** Politeness order, which is also the order a scene draws them in. */
export const DEFAULT_REGISTER_CAST = [
  "friend",
  "teacher",
  "grandmother",
  "clerk",
] as const;

export function castView(id: string): RegisterAudienceView {
  const a = REGISTER_AUDIENCES[id];
  if (!a) throw new Error(`unknown register audience "${id}"`);
  return {
    id: a.id,
    ja: a.ja,
    label: a.label,
    color: COLORS[id] ?? "#94a3b8",
    politeness: a.politeness,
    role: ROLES[id] ?? "friend",
    portraitUrl: castPortraitUrl(id),
    bowPortraitUrl: castBowPortraitUrl(id),
  };
}
