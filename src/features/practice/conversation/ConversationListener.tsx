/**
 * Conversation listener (comprehension mode).
 *
 * Plays an authored dialogue end-to-end — each line auto-plays in its
 * speaker's voice with the speaker chip highlighted — then asks
 * context/comprehension questions built from the dialogue ("what did X
 * say?"). The transcript is always on screen with inline dictionary lookup
 * (`<TappableText>`) + English translations, so the learner can tap any
 * unknown word.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import type { Conversation } from "@/features/practice/content";
import {
  conversationLineHasAudio,
  playConversationLine,
} from "./conversationAudio";
import {
  buildConversationQuestions,
  type ConversationQuestion,
} from "./conversationQuestions";

const TURN_GAP_MS = 500;

interface Props {
  conv: Conversation;
  lang: string;
  defaultTtsLang: string;
  onExit: () => void;
}

export function ConversationListener({
  conv,
  lang,
  defaultTtsLang,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const questions = useMemo(() => buildConversationQuestions(conv), [conv]);
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

  const sessionRef = useRef(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSequence = useCallback(() => {
    sessionRef.current += 1;
    const mySession = sessionRef.current;
    setIsPlaying(true);
    setActiveIdx(null);
    void (async () => {
      for (let i = 0; i < conv.lines.length; i++) {
        if (sessionRef.current !== mySession) return;
        const line = conv.lines[i];
        setActiveIdx(i);
        await playConversationLine(
          line.text,
          voiceById.get(line.speaker),
          defaultTtsLang,
          () => sessionRef.current === mySession,
        );
        if (sessionRef.current !== mySession) return;
        await new Promise((r) => setTimeout(r, TURN_GAP_MS));
      }
      if (sessionRef.current !== mySession) return;
      setIsPlaying(false);
      setActiveIdx(null);
    })();
  }, [conv.lines, voiceById, defaultTtsLang]);

  // Auto-play on mount; cancel any in-flight sequence on unmount.
  useEffect(() => {
    const handle = setTimeout(() => playSequence(), 350);
    return () => {
      clearTimeout(handle);
      sessionRef.current += 1;
      setIsPlaying(false);
      setActiveIdx(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per conversation
  }, [conv.id]);

  const playLine = useCallback(
    (i: number) => {
      const line = conv.lines[i];
      sessionRef.current += 1;
      const token = sessionRef.current;
      setActiveIdx(i);
      void playConversationLine(
        line.text,
        voiceById.get(line.speaker),
        defaultTtsLang,
        () => sessionRef.current === token,
      ).then(() => {
        if (sessionRef.current === token) setActiveIdx(null);
      });
    },
    [conv.lines, voiceById, defaultTtsLang],
  );

  // ── Question state ──────────────────────────────────────────────────────
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  const q: ConversationQuestion | undefined = questions[qIdx];
  const committed = selected !== null;

  const choose = (opt: string) => {
    if (!q || committed) return;
    setSelected(opt);
    setScore((s) => ({
      correct: s.correct + (opt === q.correct ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (qIdx + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setSelected(null);
    setQIdx((i) => i + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{conv.title}</h2>
          <p className="text-sm text-text-secondary">{conv.situation}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <Icon name="arrowLeft" size={16} aria-hidden />
          {t("practice.conversation.back", { defaultValue: "Back" })}
        </Button>
      </div>

      {/* Replay control */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playSequence}
          disabled={isPlaying}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:opacity-60"
          aria-label={t("practice.conversation.replayAria", {
            defaultValue: "Replay conversation",
          })}
        >
          <Icon name="play" size={22} aria-hidden />
        </button>
        <p className="text-sm font-medium text-text-secondary">
          {isPlaying
            ? t("practice.conversation.playing", { defaultValue: "Playing…" })
            : t("practice.conversation.replay", {
                defaultValue: "Replay the conversation",
              })}
        </p>
      </div>

      {/* Transcript with inline lookup */}
      <Card padding="md" className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {t("practice.conversation.transcript", { defaultValue: "Transcript" })}
        </p>
        {conv.lines.map((line, i) => {
          const active = activeIdx === i;
          const hasAudio = conversationLineHasAudio(
            line.text,
            voiceById.get(line.speaker),
            defaultTtsLang,
          );
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition ${
                active
                  ? "border-accent bg-accent-muted"
                  : "border-border/60 bg-surface"
              }`}
            >
              <span className="shrink-0 pt-0.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                {labelById.get(line.speaker) ?? line.speaker}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base text-text-primary" lang={lang}>
                  <TappableText text={line.text} lang={lang} />
                </p>
                {line.reading && (
                  <p className="text-xs text-text-muted">{line.reading}</p>
                )}
                <p className="text-sm text-text-secondary">{line.translation}</p>
              </div>
              <button
                type="button"
                onClick={() => playLine(i)}
                disabled={!hasAudio}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted disabled:opacity-40"
                aria-label={t("practice.conversation.playLine", {
                  defaultValue: "Play line",
                })}
              >
                <Icon name="volume" size={14} className="text-accent" />
              </button>
            </div>
          );
        })}
      </Card>

      {/* Comprehension questions */}
      {questions.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t("practice.conversation.readAlong", {
            defaultValue: "Listen and read along — tap any word you don't know.",
          })}
        </p>
      ) : done ? (
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="check" size={24} aria-hidden />
          </div>
          <p className="mt-3 text-lg font-semibold text-text-primary">
            {t("practice.conversation.followed", {
              defaultValue: "You followed {{correct}} of {{total}}",
              correct: score.correct,
              total: score.total,
            })}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="primary" onClick={onExit}>
              {t("practice.conversation.backToList", {
                defaultValue: "Back to conversations",
              })}
            </Button>
          </div>
        </Card>
      ) : (
        q && (
          <Card padding="lg">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {t("practice.conversation.question", {
                defaultValue: "Question {{n}} of {{total}}",
                n: qIdx + 1,
                total: questions.length,
              })}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-text-primary">
              {t("practice.conversation.whatSaid", {
                defaultValue: "What did {{speaker}} say?",
                speaker: q.promptSpeaker,
              })}
            </h3>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt) => {
                const isCorrect = opt === q.correct;
                const isPicked = opt === selected;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={committed}
                    onClick={() => choose(opt)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                      committed && isCorrect
                        ? "border-success bg-success/10 text-text-primary"
                        : committed && isPicked
                          ? "border-error bg-error/10 text-text-primary"
                          : committed
                            ? "border-border bg-surface text-text-muted"
                            : "border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {committed && (
              <div className="mt-4 flex justify-end">
                <Button variant="primary" onClick={nextQuestion}>
                  {qIdx + 1 >= questions.length
                    ? t("practice.conversation.finish", { defaultValue: "Finish" })
                    : t("practice.conversation.next", { defaultValue: "Next" })}
                </Button>
              </div>
            )}
          </Card>
        )
      )}
    </div>
  );
}
