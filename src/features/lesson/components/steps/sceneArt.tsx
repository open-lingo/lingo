/**
 * Shared art vocabulary for the explanatory scenes.
 *
 * The scenes only teach if they look like ONE system: a particle marker in a
 * register card and a particle marker in an m31 transfer diagram must be the
 * same colour, or the learner reads it as part of the word it clings to rather
 * than as a class of thing. That only holds if it is defined once.
 *
 * Matches `src/pub/lingo-art/svg/` — 2.5px #1e293b outline, flat fill, no
 * gradients — so hand-authored art and generated geometry sit together.
 */
export const OUTLINE = "#1e293b";

/** Every grammar marker, in every scene, one colour — so a particle reads as
 *  a CLASS of thing rather than as part of the word it clings to. */
export const PARTICLE = "#e11d48";

/*
 * The cast used to live here as a faceless `Blob` with a `bow` prop. Both are
 * gone as of 2026-08-18: the register cast moved to `castArt.tsx` (real
 * figures — Spencer: *"so ambiguous blobs arent the only thing"*), and
 * `TransferScene` carries its own local blob because a transfer NODE must stay
 * faceless. A labelled node in a relation cannot look like a portrait — a face
 * cannot carry 「あに」 (2026-05-18 blocklist audit). The register scene is the
 * opposite case: WHO you are addressing is the entire content of the lesson.
 */

/** Chip row shared by every scene's control strip — the controls ARE the
 *  grammar, so they look the same everywhere. */
export function SceneChips<T extends { id: string; label: string }>({
  legend,
  items,
  value,
  onChange,
}: {
  legend: string;
  items: readonly T[];
  value: string;
  onChange: (id: string) => void;
}) {
  /* A picker with one option is not a picker. Scenes are authored per grammar
     point, and a point that only owns one frame (m15 まえに before てから has
     been taught) must not show a control the learner cannot use. */
  if (items.length < 2) return null;
  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">{legend}</legend>
      <span className="text-xs font-semibold text-text-muted">{legend}</span>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={it.id === value}
          onClick={() => onChange(it.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            it.id === value
              ? "bg-accent text-accent-foreground"
              : "border border-border text-text-secondary hover:border-accent"
          }`}
        >
          {it.label}
        </button>
      ))}
    </fieldset>
  );
}
