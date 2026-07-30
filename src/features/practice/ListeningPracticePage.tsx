import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import { useLang } from "@/shared/hooks/useLangPath";
import { getTtsLang } from "./data/practiceDataLoader";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import { getStories, getConversations } from "@/features/practice/content";
import { useCourseLevel } from "./useCourseLevel";
import {
  playConversationLine,
  conversationLineHasAudio,
} from "./conversation/conversationAudio";
import { lineAtomIds } from "./conversation/conversationSrs";
import {
  getCardState,
  setCardState,
  createInitialState,
  gradeFromLesson,
} from "@/features/flashcards/engine";

const SESSION_COUNT = 12;

/**
 * Listening practice — a calm comprehension session sourced from AUTHORED
 * content (story sentences + conversation lines) rather than generated
 * sentences, so every clip is a real, module-appropriate line the learner can
 * actually parse. Each item plays the audio (in a conversation line's speaker
 * voice when present), asks what it meant among same-set English choices, then
 * reveals the sentence with inline dictionary lookup (`<TappableText>`).
 * Correct answers lightly credit the recognition modality of the atoms the
 * line exercises (conservative SRS reinforcement).
 */

/** One listening comprehension item derived from an authored line. */
interface ListeningItem {
  id: string;
  text: string;
  translation: string;
  reading?: string;
  /** Voice tag for a conversation-line speaker (undefined = default voice). */
  voice?: string;
  /** Course-atom ids this line exercises (recognition credit on correct). */
  atomIds: string[];
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Assemble the listening pool from authored stories + conversations up to the
 * reached module, dedup by target text, shuffle by seed, cap the session.
 */
function buildListeningItems(
  langId: string,
  reachedModule: number,
  seed: number,
): ListeningItem[] {
  const raw: ListeningItem[] = [];
  const seenText = new Set<string>();

  for (const story of getStories(langId, reachedModule)) {
    for (const s of story.sentences) {
      if (!s.translation || seenText.has(s.text)) continue;
      seenText.add(s.text);
      raw.push({
        id: `${story.id}:${s.text}`,
        text: s.text,
        translation: s.translation,
        reading: s.reading,
        atomIds: lineAtomIds(s.text, langId),
      });
    }
  }

  for (const conv of getConversations(langId, reachedModule)) {
    const voiceById = new Map(conv.speakers.map((sp) => [sp.id, sp.voice]));
    for (const line of conv.lines) {
      if (!line.translation || seenText.has(line.text)) continue;
      seenText.add(line.text);
      raw.push({
        id: `${conv.id}:${line.text}`,
        text: line.text,
        translation: line.translation,
        reading: line.reading,
        voice: voiceById.get(line.speaker),
        atomIds: lineAtomIds(line.text, langId),
      });
    }
  }

  // A 2-option minimum is required for a meaningful MCQ.
  if (raw.length < 2) return [];
  return seededShuffle(raw, seed).slice(0, SESSION_COUNT);
}

export function ListeningPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const ttsLang = getTtsLang(langId);
  const reachedModule = useCourseLevel();

  // Stable per-session seed; "Practice again" mints a fresh set.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  const items = useMemo(
    () => buildListeningItems(langId, reachedModule, seed),
    [langId, reachedModule, seed],
  );

  // Warm this session's clips up front (served from the CDN).
  const prefetchTexts = useMemo(() => items.map((it) => it.text), [items]);
  usePrefetchAudio(prefetchTexts, ttsLang);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const item = items[idx] as ListeningItem | undefined;
  const done = items.length > 0 && idx >= items.length;

  const hasAudio = useMemo(
    () =>
      item ? conversationLineHasAudio(item.text, item.voice, ttsLang) : false,
    [item, ttsLang],
  );

  const choices = useMemo(
    () => (item ? buildComprehensionChoices(items, idx) : []),
    [items, idx, item],
  );

  const play = useCallback(() => {
    if (item) void playConversationLine(item.text, item.voice, ttsLang);
  }, [item, ttsLang]);

  // Auto-play a fresh item — the audio leading the question is the point.
  useEffect(() => {
    if (item) void playConversationLine(item.text, item.voice, ttsLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per item
  }, [item?.id, ttsLang]);

  const choose = (choice: string) => {
    if (!item || selected !== null) return;
    setSelected(choice);
    const correct = choice === item.translation;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    if (correct) creditSrs(item);
  };

  const next = () => {
    setSelected(null);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setSelected(null);
    setIdx(0);
    setScore({ correct: 0, total: 0 });
    setSeed(Math.floor(Math.random() * 1e9));
  };

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        {t("practice.listening.title", { defaultValue: "Listening" })}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("practice.listening.subtitle", {
          defaultValue: "Real lines you can already read",
        })}
      </p>
    </div>
  );

  // Nothing authored at this level yet — encourage, don't scold.
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="volume" size={28} aria-hidden />}
          title={t("practice.listening.empty.title", {
            defaultValue: "No listening content yet",
          })}
          description={t("practice.listening.empty.desc", {
            defaultValue:
              "Keep working through your lessons — stories and conversations unlock as you reach the modules they belong to.",
          })}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        {header}
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="check" size={24} aria-hidden />
          </div>
          <p className="mt-4 text-lg font-semibold text-text-primary">
            {t("practice.listening.done.title", { defaultValue: "Session complete" })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.listening.done.score", {
              defaultValue: "You understood {{correct}} of {{total}}",
              correct: score.correct,
              total: score.total,
            })}
          </p>
          <div className="mt-5 flex justify-center">
            <Button variant="primary" onClick={restart}>
              {t("practice.listening.done.again", { defaultValue: "Practice again" })}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!item) return <div className="space-y-4">{header}</div>;

  const revealed = selected !== null;

  return (
    <div className="space-y-4">
      {header}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {t("practice.listening.progress", {
              defaultValue: "Item {{current}} of {{total}}",
              current: idx + 1,
              total: items.length,
            })}
          </span>
          <span>
            {t("practice.listening.score", {
              defaultValue: "{{correct}} correct",
              correct: score.correct,
            })}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(idx / items.length) * 100}%` }}
          />
        </div>
      </div>

      <Card padding="lg" className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("practice.listening.instruction", { defaultValue: "What did you hear?" })}
        </p>

        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={play}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent-hover"
            aria-label={t("practice.listening.playAria", { defaultValue: "Play audio" })}
          >
            <Icon name="volume" size={28} aria-hidden />
          </button>
        </div>

        {!hasAudio && (
          <p className="mt-3 text-xs text-text-muted">
            {t("practice.listening.noAudio", {
              defaultValue: "Audio isn't available for this one — reveal the answer below.",
            })}
          </p>
        )}

        {/* Choices — English meanings, one correct + same-set distractors */}
        <div className="mx-auto mt-5 grid max-w-md gap-2 sm:grid-cols-2">
          {choices.map((choice) => {
            const isCorrect = choice === item.translation;
            const isPicked = choice === selected;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => choose(choice)}
                disabled={revealed}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  revealed && isCorrect
                    ? "border-success bg-success/10 text-text-primary"
                    : revealed && isPicked
                      ? "border-error bg-error/10 text-text-primary"
                      : revealed
                        ? "border-border bg-surface text-text-muted"
                        : "border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* Reveal — the sentence (tappable), its reading, and its meaning */}
        {revealed && (
          <div className="mx-auto mt-5 max-w-md rounded-lg border border-border bg-surface-muted p-4">
            <p className="text-xl font-bold text-text-primary" lang={langId}>
              <TappableText text={item.text} lang={langId} />
            </p>
            {item.reading && (
              <p className="mt-0.5 text-sm text-text-muted">{item.reading}</p>
            )}
            <p className="mt-1.5 text-sm text-text-secondary">{item.translation}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={next}>
                {idx + 1 >= items.length
                  ? t("practice.listening.finish", { defaultValue: "Finish" })
                  : t("practice.listening.next", { defaultValue: "Next" })}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Correct English meaning + up to three DISTINCT distractor meanings pulled
 * from the OTHER items in the same session. Deterministic + rotated per index.
 */
function buildComprehensionChoices(items: ListeningItem[], idx: number): string[] {
  const correct = items[idx].translation;
  const seen = new Set([correct]);
  const distractors: string[] = [];
  for (let step = 1; step < items.length && distractors.length < 3; step++) {
    const other = items[(idx + step) % items.length].translation;
    if (other && !seen.has(other)) {
      seen.add(other);
      distractors.push(other);
    }
  }
  const all = [correct, ...distractors];
  const rot = idx % all.length;
  return all.slice(rot).concat(all.slice(0, rot));
}

/**
 * Conservative SRS credit — on a correct comprehension answer, nudge the
 * `recognition` modality of each atom the line exercises via the same
 * `gradeFromLesson` path lessons use.
 */
function creditSrs(item: ListeningItem): void {
  for (const atomId of item.atomIds) {
    const state = getCardState(atomId) ?? createInitialState();
    setCardState(atomId, gradeFromLesson(state, "recognition", { correct: true }));
  }
}
