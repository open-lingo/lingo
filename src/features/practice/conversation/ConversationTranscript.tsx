/**
 * Conversation transcript — the shared dialogue line list.
 *
 * Extracted from `ConversationListener` so the story library's read-only
 * conversation reader renders the SAME rows the practice listener does: same
 * speaker chip, same inline dictionary lookup (`TappableText`), same per-line
 * play button and the same active-line treatment the lesson player's dialogue
 * transcript uses.
 *
 * Two layouts. `sided` is the two-sided chat: the learner's own side sits on
 * the right, everyone else on the left, which is how a scripted dialogue reads
 * as a conversation rather than as a table of turns. Without it the rows are
 * full width — the listener's original look, which is deliberately dense
 * because comprehension questions sit right under it.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import type { Conversation } from "@/features/practice/content";
import { buildSpeakerColors } from "@/features/practice/stories/speakerColor";
import { conversationLineHasAudio } from "./conversationAudio";

interface ConversationTranscriptProps {
  conv: Conversation;
  lang: string;
  defaultTtsLang: string;
  /** Line currently being spoken, or null. */
  activeIdx: number | null;
  onPlayLine: (index: number) => void;
  /** Two-sided chat layout (learner's side right-aligned). */
  sided?: boolean;
  /** Reading aid line under each turn. Gated by the caller's romaji setting. */
  showReading?: boolean;
  showTranslation?: boolean;
}

/**
 * Which speaker id counts as "the learner's side". `learnerRole` when the
 * dialogue declares one; otherwise the first declared speaker, so a
 * listener-only conversation still gets a stable two-sided split instead of
 * collapsing everything onto one edge.
 */
export function learnerSideId(conv: Conversation): string | undefined {
  return conv.learnerRole ?? conv.speakers[0]?.id;
}

/**
 * The declared cast, in declaration order — which is also the order each
 * speaker first appears, since `speakers[]` is authored alongside the script.
 * Shared with `SpeakerCast` so the chip above the transcript and the name in
 * each row resolve to the same colour.
 */
export function conversationCast(conv: Conversation) {
  return conv.speakers.map((s) => ({ key: s.id, label: s.label }));
}

export function ConversationTranscript({
  conv,
  lang,
  defaultTtsLang,
  activeIdx,
  onPlayLine,
  sided = false,
  showReading = true,
  showTranslation = true,
}: ConversationTranscriptProps) {
  const { t } = useTranslation();

  const voiceById = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const s of conv.speakers) m.set(s.id, s.voice);
    return m;
  }, [conv.speakers]);
  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of conv.speakers) m.set(s.id, s.label);
    return m;
  }, [conv.speakers]);

  // Keyed on speaker id, assigned by declaration order — the same input
  // `SpeakerCast` gets, so a name's colour matches its chip.
  const colorById = useMemo(
    () => buildSpeakerColors(conv.speakers.map((s) => s.id)),
    [conv.speakers],
  );

  const ownSide = sided ? learnerSideId(conv) : undefined;

  return (
    <>
      {conv.lines.map((line, i) => {
        const active = activeIdx === i;
        const hasAudio = conversationLineHasAudio(
          line.text,
          voiceById.get(line.speaker),
          defaultTtsLang,
        );
        const own = sided && line.speaker === ownSide;
        const bubble = (
          <div
            className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition ${
              // A one-word reply ("네.") would otherwise render as a sliver
              // beside full-width turns; the floor keeps every bubble legible
              // as a turn. Capped by max-w so long turns still wrap.
              sided ? "min-w-[13rem] max-w-[85%]" : ""
            } ${
              active
                ? "border-accent bg-accent-muted"
                : own
                  ? "border-accent/30 bg-accent/5"
                  : "border-border/60 bg-surface"
            }`}
          >
            {/* Icon + name stay on the SAME row as the text (see the layout
                note above) — colour is what separates the speakers, not extra
                vertical space. */}
            <span
              className={`flex shrink-0 items-center gap-1 pt-0.5 text-xs font-bold uppercase tracking-wider ${
                colorById.get(line.speaker)?.text ?? "text-text-muted"
              }`}
            >
              <Icon name="user" size={13} aria-hidden />
              {labelById.get(line.speaker) ?? line.speaker}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base text-text-primary" lang={lang}>
                <TappableText text={line.text} lang={lang} />
              </p>
              {showReading && line.reading && (
                <p className="text-xs text-text-muted">{line.reading}</p>
              )}
              {showTranslation && (
                <p className="text-sm text-text-secondary">{line.translation}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onPlayLine(i)}
              disabled={!hasAudio}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted disabled:opacity-40"
              aria-label={t("practice.conversation.playLine", { defaultValue: "Play line" })}
            >
              <Icon name="volume" size={14} className="text-accent" />
            </button>
          </div>
        );

        if (!sided) return <div key={i}>{bubble}</div>;
        return (
          <div key={i} className={`flex ${own ? "justify-end" : "justify-start"}`}>
            {bubble}
          </div>
        );
      })}
    </>
  );
}
