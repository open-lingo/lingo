/**
 * Portrait art for the register cast (`registerAudiences.ts`).
 *
 * Spencer 2026-08-18: *"I think we DO want images we preload of who each
 * person is."* Generated locally with Z-Image-Turbo; recipe, post-processing
 * and the reason the naive background cut is wrong are all in
 * `src/pub/lingo-art/cast/README.md`.
 *
 * ~50 KB for the whole cast across both poses, so `preloadCastPortraits()` is
 * cheap enough to fire on any surface about to show a register beat. It is a plain
 * `new Image()` warm rather than a `<link rel=preload>` because the cast is
 * needed on a handful of routes, not on boot — putting it in `index.html`
 * would cost every learner the bytes on every visit.
 */

const CAST_BASE = "/lingo-art/cast";

/** Keys match `REGISTER_AUDIENCES` ids. */
export const CAST_PORTRAITS: Readonly<Record<string, string>> = {
  friend: `${CAST_BASE}/friend.png`,
  teacher: `${CAST_BASE}/teacher.png`,
  grandmother: `${CAST_BASE}/grandmother.png`,
  clerk: `${CAST_BASE}/clerk.png`,
};

/**
 * The deferential pose, one per character.
 *
 * Produced by EDITING the upright portrait with Qwen-Image-Edit rather than
 * regenerating it — re-prompting with a pose clause yields a different person
 * in the same style. See `src/pub/lingo-art/cast/README.md`.
 *
 * There is deliberately no level-2 pose. The "small nod" prompt came back as a
 * three-quarter turn rather than a shallow bow, and です・ます is the polite
 * DEFAULT rather than a deferential act, so level 2 is the upright portrait
 * with a slight lean.
 */
export const CAST_BOW_PORTRAITS: Readonly<Record<string, string>> = {
  friend: `${CAST_BASE}/friend-bow.png`,
  teacher: `${CAST_BASE}/teacher-bow.png`,
  grandmother: `${CAST_BASE}/grandmother-bow.png`,
  clerk: `${CAST_BASE}/clerk-bow.png`,
};

export function castPortraitUrl(audienceId: string): string | undefined {
  return CAST_PORTRAITS[audienceId];
}

export function castBowPortraitUrl(audienceId: string): string | undefined {
  return CAST_BOW_PORTRAITS[audienceId];
}

let warmed = false;

/** Idempotent — safe to call from every mount. */
export function preloadCastPortraits(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const url of [
    ...Object.values(CAST_PORTRAITS),
    ...Object.values(CAST_BOW_PORTRAITS),
  ]) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
