/**
 * Unauthored-module sentinel ratchet (freq-gap plan §4.1a).
 *
 * An atom whose `fromModule` names a module that is not on the live
 * curriculum is in the worst state an atom can be in: registered and
 * graded-capable, but the module-fallback unlock path can never fire and the
 * frequency drip's `fromModule === "future"` filter excludes it — so it can
 * NEVER unlock. That state is sometimes deliberate (vocabulary allocated to
 * a spine module that isn't built yet), but it must be a visible, named debt,
 * not a silent one.
 *
 * This is `irAtomRegistration.test.ts`'s FROZEN_UNREGISTERED pattern applied
 * to the other arrow: every such atom must sit on the explicit, SHRINK-ONLY
 * allowlist below. When the owning module ships (or the atom is retagged to a
 * live teaching module), its entry MUST be removed in the same change.
 */
import { describe, it, expect } from "vitest";

import { jaModule } from "../module";
import { JA_COURSE_ATOMS } from "../courseAtoms";

/**
 * atom id → the unauthored sentinel it is allowed to sit on.
 *
 * - `m49` (Keigo I, spine-n4.md): allocated vocabulary for an unbuilt module.
 * - `thr-n4` (glue-adverb drip): やっぱり/ぜったい retag to m25 (F13) and
 *   もちろん to m24 (pack 11) and べつに to m29 (F18) WITH their insert
 *   lessons — retagging ahead of the lesson would unlock them with no intro
 *   (docs/ja-freq-gap-plan-2026-08-26.md §4.1).
 */
const ALLOWED_UNAUTHORED: Readonly<Record<string, string>> = {
  mochiron: "thr-n4",
  zettai: "thr-n4",
  betsuni: "thr-n4",
  yappari: "thr-n4",
  keigo: "m49",
  teinei: "m49",
  shitsurei: "m49",
  tameguchi: "m49",
  senpai: "m49",
  joushi: "m49",
  douryou: "m49",
  kouhai: "m49",
  shiriai: "m49",
};

/**
 * Live NON-module sources: teaching surfaces that unlock atoms outside the
 * module-fallback path entirely (the survival sidequest is served by
 * mockCourse and gated in features/practice). Not debt.
 */
const LIVE_NON_MODULE_SOURCES = new Set(["sidequest-survival"]);

describe("unauthored-module allowlist", () => {
  const liveModuleIds = new Set(jaModule.curriculum.map((m) => m.id));

  it("every atom fromModule is live, 'future', or explicitly allowlisted", () => {
    const offenders = JA_COURSE_ATOMS.filter(
      (a) =>
        a.fromModule !== "future" &&
        !liveModuleIds.has(a.fromModule) &&
        !LIVE_NON_MODULE_SOURCES.has(a.fromModule) &&
        ALLOWED_UNAUTHORED[a.id] !== a.fromModule,
    ).map((a) => `${a.id} → ${a.fromModule}`);
    expect(
      offenders,
      `atoms on unauthored modules without an allowlist entry (they can NEVER unlock):\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("allowlist is shrink-only — no dead entries", () => {
    const byId = new Map(JA_COURSE_ATOMS.map((a) => [a.id, a]));
    const dead = Object.entries(ALLOWED_UNAUTHORED)
      .filter(([id, mod]) => {
        const atom = byId.get(id);
        // Dead if the atom is gone, moved off the sentinel, or the sentinel
        // module has since gone live.
        return !atom || atom.fromModule !== mod || liveModuleIds.has(mod);
      })
      .map(([id, mod]) => `${id} (${mod})`);
    expect(
      dead,
      `resolved now — remove from ALLOWED_UNAUTHORED: ${dead.join(", ")}`,
    ).toEqual([]);
  });
});
