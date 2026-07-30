import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLang } from "@/shared/hooks/useLangPath";
import { getTtsLang } from "./data/practiceDataLoader";
import { usePrefetchAudio } from "@/shared/tts/prefetch";
import { generatePracticeItems, type PracticeItem } from "./engine";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import {
  getCardState,
  setCardState,
  createInitialState,
  gradeFromLesson,
} from "@/features/flashcards/engine";

const SESSION_COUNT = 12;

/**
 * Listening practice — a calm comprehension session generated from the
 * learner's own learned vocab (not a fixed clip list). Each item TTS-speaks a
 * sentence built from words the learner knows; they pick what it meant from
 * same-set English choices, then the sentence + reading + meaning are revealed.
 * Correct answers lightly credit the recognition modality of the atoms the
 * sentence exercised (conservative SRS reinforcement).
 */
export function ListeningPracticePage() {
  const { t } = useTranslation();
  const langId = useLang();
  const ttsLang = getTtsLang(langId);

  // A stable per-session seed keeps the generated set fixed while the learner
  // works through it; "Practice again" mints a fresh one for a new set.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  const items = useMemo(
    () =>
      generatePracticeItems(langId, {
        surface: "listening",
        count: SESSION_COUNT,
        seed,
      }),
    [langId, seed],
  );

  // Warm this session's clips up front (audio is served from the CDN).
  const prefetchTexts = useMemo(
    () => items.map((it) => it.promptAudioText ?? it.target),
    [items],
  );
  usePrefetchAudio(prefetchTexts, ttsLang);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const item = items[idx] as PracticeItem | undefined;
  const done = items.length > 0 && idx >= items.length;

  const audioText = item ? item.promptAudioText ?? item.target : "";
  const hasAudio = useMemo(
    () => (audioText ? getTtsUrl(audioText, ttsLang) !== null : false),
    [audioText, ttsLang],
  );

  const choices = useMemo(
    () => (item ? buildComprehensionChoices(items, idx) : []),
    [items, idx, item],
  );

  const play = useCallback(() => {
    if (audioText) void playJaAudio(audioText, ttsLang);
  }, [audioText, ttsLang]);

  // Auto-play when a fresh item comes up — this is a listening surface, so the
  // audio leading the question is the point. Replays are on the Play button.
  useEffect(() => {
    if (item) void playJaAudio(item.promptAudioText ?? item.target, ttsLang);
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
          defaultValue: "From words you're learning",
        })}
      </p>
    </div>
  );

  // Low-vocab / nothing to generate — encourage, don't scold.
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState
          icon={<Icon name="volume" size={28} aria-hidden />}
          title={t("practice.listening.empty.title", {
            defaultValue: "Not enough words yet",
          })}
          description={t("practice.listening.empty.desc", {
            defaultValue:
              "Learn a few more words in your lessons and they'll show up here as listening practice built just from what you know.",
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

        {/* Reveal — the sentence, its reading, and its meaning */}
        {revealed && (
          <div className="mx-auto mt-5 max-w-md rounded-lg border border-border bg-surface-muted p-4">
            <p className="text-xl font-bold text-text-primary">{item.target}</p>
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
 * Build the comprehension choices for `items[idx]`: the correct English meaning
 * plus up to three DISTINCT distractor meanings pulled from the OTHER generated
 * items in the same session (so distractors are plausibly same-set vocab).
 * Deterministic — stable across re-renders and rotated per index for variety.
 */
function buildComprehensionChoices(items: PracticeItem[], idx: number): string[] {
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
  // Rotate placement so the correct answer isn't always first, deterministically.
  const rot = idx % all.length;
  return all.slice(rot).concat(all.slice(0, rot));
}

/**
 * Conservative SRS credit — on a correct comprehension answer, nudge the
 * `recognition` modality of each atom the sentence exercised via the same
 * `gradeFromLesson` path lessons use. Only correct answers credit; seeds carry
 * no atoms so they're inert.
 */
function creditSrs(item: PracticeItem): void {
  for (const atomId of item.exercisedAtomIds) {
    const state = getCardState(atomId) ?? createInitialState();
    setCardState(atomId, gradeFromLesson(state, "recognition", { correct: true }));
  }
}
