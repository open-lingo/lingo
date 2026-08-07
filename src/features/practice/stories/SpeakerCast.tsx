/**
 * The cast — who is in this piece, and what colour each of them is.
 *
 * Two shapes over one chip row:
 *  - `SpeakerChips` is the bare row (label + chips) with NO surrounding
 *    chrome, for callers that already own a surface — the story reader puts it
 *    in the right-hand header card, where the strip's own border and muted fill
 *    would read as a box inside a box.
 *  - `SpeakerCast` wraps it in the strip that sits directly above a transcript,
 *    so the colour coding in the body is legible on first contact rather than
 *    being a pattern the reader has to infer. A two-person dialogue costs one
 *    line of vertical space.
 *
 * Colours come from `speakerColorAt` by POSITION, keyed on whatever the caller
 * uses to identify a speaker — ids for conversations, names for stories.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { speakerColorAt } from "./speakerColor";

export interface CastMember {
  /** Stable key — a conversation speaker id, or a story's speaker name. */
  key: string;
  /** What the reader sees. */
  label: string;
}

interface SpeakerCastProps {
  /** In order of first appearance; the order IS the colour assignment. */
  members: CastMember[];
  /** Target language, for names written in the target script. */
  lang?: string;
  className?: string;
}

/** The label + chip row on its own, for a caller that supplies the surface. */
export function SpeakerChips({ members, lang, className = "" }: SpeakerCastProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {t("practice.stories.speakers", { defaultValue: "Speakers" })}
      </span>
      {members.map((m, i) => {
        const color = speakerColorAt(i);
        return (
          <span
            key={m.key}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${color.chip} ${color.border} ${color.text}`}
          >
            <Icon name="user" size={12} aria-hidden />
            <span lang={lang}>{m.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function SpeakerCast({ members, lang, className = "" }: SpeakerCastProps) {
  // One speaker is not a cast — the colour tells the reader nothing there.
  if (members.length < 2) return null;

  return (
    <SpeakerChips
      members={members}
      lang={lang}
      className={`rounded-xl border border-border/60 bg-surface-muted px-3 py-2 ${className}`.trim()}
    />
  );
}

/**
 * The cast is worth showing only when there is more than one of them — the same
 * rule `SpeakerCast` applies to itself, exported so a caller laying out AROUND
 * the cast (the story header's two-column grid) can collapse rather than park
 * an empty card next to the story info.
 */
export function hasCast(members: readonly CastMember[]): boolean {
  return members.length >= 2;
}
