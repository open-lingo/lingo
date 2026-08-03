/**
 * The cast strip — who is in this piece, and what colour each of them is.
 *
 * Sits directly above the transcript / prose so the colour coding in the body
 * is legible on first contact rather than being a pattern the reader has to
 * infer. Deliberately a single wrapping row of chips, not a card with a heavy
 * header: a two-person dialogue should cost one line of vertical space.
 *
 * Colours come from `buildSpeakerColors`, keyed on whatever the caller uses to
 * identify a speaker — ids for conversations, names for stories.
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

export function SpeakerCast({ members, lang, className = "" }: SpeakerCastProps) {
  const { t } = useTranslation();
  // One speaker is not a cast — the colour tells the reader nothing there.
  if (members.length < 2) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border/60 bg-surface-muted px-3 py-2 ${className}`.trim()}
    >
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
