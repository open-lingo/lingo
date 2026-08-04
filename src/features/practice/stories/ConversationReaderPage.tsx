/**
 * The conversation reader — a conversation opened from the reading library.
 *
 * Read-only by design: a two-sided chat the learner listens to and reads,
 * with inline dictionary lookup on every turn. Roleplay and speech
 * recognition stay on the conversation practice surface; this is the
 * *reading* half of the same content, which is why it sits under the story
 * library's route and records to the same `storyProgress` store.
 *
 * The transcript itself is `ConversationTranscript`, shared with the practice
 * listener, and playback is the practice surface's `playConversationLine`, so
 * a dialogue sounds and looks identical wherever the learner meets it.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Button, EmptyState } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { allConversations } from "@/features/practice/content";
import { getTtsLang } from "@/features/practice/data/practiceDataLoader";
import { playConversationLine } from "@/features/practice/conversation/conversationAudio";
import {
  ConversationTranscript,
  conversationCast,
} from "@/features/practice/conversation/ConversationTranscript";
import { SpeakerCast } from "./SpeakerCast";
import { recordStoryRead } from "@/shared/storyProgress";
import { recordPracticeResult } from "@/features/practice/practiceStats";
import { useShowReadingRomaji } from "@/features/practice/reading/useShowReadingRomaji";

const TURN_GAP_MS = 500;

interface ConversationReaderPageProps {
  /**
   * The conversation to read. Resolved from the route by `ReadingRoute`, not
   * read from `useParams` here — one route serves stories AND conversations,
   * so the id has to be matched against the content before a reader is chosen.
   */
  conversationId: string;
}

export function ConversationReaderPage({
  conversationId,
}: ConversationReaderPageProps) {
  const { t } = useTranslation();
  const langId = useLang();
  const langPath = useLangPath();
  const ttsLang = getTtsLang(langId);
  const showRomaji = useShowReadingRomaji(langId);

  const conv = useMemo(
    () => allConversations(langId).find((c) => c.id === conversationId) ?? null,
    [langId, conversationId],
  );

  const [showEnglish, setShowEnglish] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  // Incrementing session token — a second press (or a single-line tap) cancels
  // the in-flight sequence instead of racing it.
  const sessionRef = useRef(0);
  const playing = useRef(false);

  const playAll = useCallback(() => {
    if (!conv) return;
    if (playing.current) {
      playing.current = false;
      sessionRef.current += 1;
      setActiveIdx(null);
      return;
    }
    sessionRef.current += 1;
    const mySession = sessionRef.current;
    playing.current = true;
    const voiceFor = (speakerId: string) =>
      conv.speakers.find((s) => s.id === speakerId)?.voice;
    void (async () => {
      for (let i = 0; i < conv.lines.length; i++) {
        if (sessionRef.current !== mySession) return;
        setActiveIdx(i);
        await playConversationLine(
          conv.lines[i].text,
          voiceFor(conv.lines[i].speaker),
          ttsLang,
          () => sessionRef.current === mySession,
        );
        if (sessionRef.current !== mySession) return;
        await new Promise((r) => setTimeout(r, TURN_GAP_MS));
      }
      if (sessionRef.current !== mySession) return;
      playing.current = false;
      setActiveIdx(null);
    })();
  }, [conv, ttsLang]);

  const playLine = useCallback(
    (i: number) => {
      if (!conv) return;
      playing.current = false;
      sessionRef.current += 1;
      const token = sessionRef.current;
      setActiveIdx(i);
      void playConversationLine(
        conv.lines[i].text,
        conv.speakers.find((s) => s.id === conv.lines[i].speaker)?.voice,
        ttsLang,
        () => sessionRef.current === token,
      ).then(() => {
        if (sessionRef.current === token) setActiveIdx(null);
      });
    },
    [conv, ttsLang],
  );

  const finish = useCallback(() => {
    if (!conv) return;
    // Same store, same key shape as a story — the library reads both through
    // one progress map, so a read conversation gets the same check mark.
    recordStoryRead(conv.id);
    recordPracticeResult("reading", conv.id, true);
    setDone(true);
  }, [conv]);

  const backLink = (
    <Link
      to={langPath("practice/stories")}
      className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition hover:text-text-primary"
    >
      <Icon name="arrowLeft" size={16} aria-hidden />
      {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
    </Link>
  );

  if (!conv) {
    return (
      <EmptyState
        icon={<Icon name="messageCircle" size={28} aria-hidden />}
        title={t("practice.stories.conversationNotFound", {
          defaultValue: "We couldn't find that conversation.",
        })}
        action={
          <Link
            to={langPath("practice/stories")}
            className={composeButtonClasses({ variant: "primary" })}
          >
            {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
          </Link>
        }
      />
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        {backLink}
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="checkCircle" size={28} aria-hidden />
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {t("practice.stories.quiz.doneTitle", { defaultValue: "Nice reading" })}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => setDone(false)}>
              {t("practice.stories.quiz.reread", { defaultValue: "Read again" })}
            </Button>
            <Link
              to={langPath("practice/stories")}
              className={composeButtonClasses({ variant: "primary" })}
            >
              {t("practice.stories.backToLibrary", { defaultValue: "All stories" })}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {backLink}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={playAll}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-text-secondary transition hover:text-text-primary"
          >
            <Icon name={activeIdx === null ? "play" : "pause"} size={14} aria-hidden />
            {activeIdx === null
              ? t("practice.stories.playAll", { defaultValue: "Play all" })
              : t("practice.stories.stop", { defaultValue: "Stop" })}
          </button>
          <button
            type="button"
            onClick={() => setShowEnglish((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-text-secondary transition hover:text-text-primary"
          >
            <Icon name="eye" size={14} aria-hidden />
            {showEnglish
              ? t("practice.stories.hideEnglish", { defaultValue: "Hide English" })
              : t("practice.stories.showEnglish", { defaultValue: "Show English" })}
          </button>
        </div>
      </div>

      <Card padding="lg" className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{conv.title}</h1>
          <p className="text-sm text-text-secondary">{conv.situation}</p>
        </div>

        <SpeakerCast members={conversationCast(conv)} lang={langId} />

        <div className="space-y-2">
          <ConversationTranscript
            conv={conv}
            lang={langId}
            defaultTtsLang={ttsLang}
            activeIdx={activeIdx}
            onPlayLine={playLine}
            sided
            showReading={showRomaji}
            showTranslation={showEnglish}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={finish}>
          <Icon name="check" size={16} className="mr-1.5" aria-hidden />
          {t("practice.stories.markRead", { defaultValue: "Mark as read" })}
        </Button>
      </div>
    </div>
  );
}
